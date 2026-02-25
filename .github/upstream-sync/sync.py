#!/usr/bin/env python3
"""Upstream sync for ported and adapted catalog skills.

Checks upstream repositories for body content changes in ported skills,
applies safe updates (no local modifications) via PR, reports non-safe
changes as issues, detects new upstream skills, and monitors adapted
skills for upstream changes (advisory only).

Use --diff to manually inspect body diffs between local catalog and upstream.

Requirements: Python 3.10+ stdlib only. Runs on GitHub Actions with `gh` CLI.
"""

from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
CONFIG_PATH = REPO_ROOT / "catalog" / "metadata" / "upstream-sources.yaml"
CACHE_PATH = Path(__file__).resolve().parent / "sha-cache.json"
CATALOG_SKILLS = REPO_ROOT / "catalog" / "skills"

# ---------------------------------------------------------------------------
# Minimal YAML parser (handles only the upstream-sources.yaml schema)
# ---------------------------------------------------------------------------


def _parse_yaml_value(raw: str) -> str:
    """Strip optional quotes from a scalar value."""
    v = raw.strip()
    if (v.startswith('"') and v.endswith('"')) or (
        v.startswith("'") and v.endswith("'")
    ):
        return v[1:-1]
    return v


def _indent_level(line: str) -> int:
    return len(line) - len(line.lstrip())


def parse_upstream_sources(path: Path) -> dict:
    """Parse upstream-sources.yaml into a Python dict.

    Returns:
        {
            "owner/repo": {
                "ref": "main",
                "discover": {"root": "skills/", "skill_file": "SKILL.md"},
                "skills": {"catalog-name": {"upstream_dir": "dir-name"}, ...},
                "adapted_skills": {"catalog-name": {"upstream_dir": "dir-name"}, ...},
                "ignored": ["dir1", ...]
            },
            ...
        }
    """
    lines = path.read_text().splitlines()
    sources: dict = {}
    current_repo = None
    current_section = (
        None  # "skills" | "adapted_skills" | "ignored" | "discover" | None
    )
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        i += 1

        if not stripped or stripped.startswith("#"):
            continue

        indent = _indent_level(line)

        # Top-level "sources:" header
        if indent == 0 and stripped == "sources:":
            continue

        # Repo key (indent 2)
        if indent == 2 and stripped.endswith(":") and "/" in stripped:
            current_repo = stripped[:-1].strip()
            sources[current_repo] = {
                "ref": "main",
                "discover": {},
                "skills": {},
                "adapted_skills": {},
                "ignored": [],
            }
            current_section = None
            continue

        if current_repo is None:
            continue

        repo = sources[current_repo]

        # Section headers at indent 4
        if indent == 4:
            if stripped.startswith("ref:"):
                repo["ref"] = _parse_yaml_value(stripped.split(":", 1)[1])
                current_section = None
            elif stripped == "discover:":
                current_section = "discover"
            elif stripped == "skills:":
                current_section = "skills"
            elif stripped.startswith("skills:"):
                # Handle inline empty: skills: {}
                rest = stripped.split(":", 1)[1].strip()
                if rest == "{}":
                    repo["skills"] = {}
                    current_section = None
                else:
                    current_section = "skills"
            elif stripped == "adapted_skills:":
                current_section = "adapted_skills"
            elif stripped.startswith("adapted_skills:"):
                # Handle inline empty: adapted_skills: {}
                rest = stripped.split(":", 1)[1].strip()
                if rest == "{}":
                    repo["adapted_skills"] = {}
                    current_section = None
                else:
                    current_section = "adapted_skills"
            elif stripped.startswith("ignored:"):
                rest = stripped.split(":", 1)[1].strip()
                if rest == "[]":
                    repo["ignored"] = []
                    current_section = None
                else:
                    current_section = "ignored"
            continue

        # Discover fields (indent 6)
        if indent == 6 and current_section == "discover":
            key, _, val = stripped.partition(":")
            repo["discover"][key.strip()] = _parse_yaml_value(val)
            continue

        # Skill entries (indent 6) — inline flow mapping: name: { upstream_dir: value }
        if indent == 6 and current_section == "skills":
            key, _, val = stripped.partition(":")
            catalog_name = key.strip()
            val = val.strip()
            # Parse inline { upstream_dir: value } or { upstream_dir: value }  # comment
            m = re.search(r"upstream_dir:\s*([^}#]+)", val)
            if m:
                upstream_dir = m.group(1).strip().rstrip(",").strip()
                upstream_dir = _parse_yaml_value(upstream_dir)
            else:
                upstream_dir = catalog_name
            repo["skills"][catalog_name] = {"upstream_dir": upstream_dir}
            continue

        # Adapted skill entries (indent 6) — may have upstream_path or upstream_dir
        if indent == 6 and current_section == "adapted_skills":
            key, _, val = stripped.partition(":")
            catalog_name = key.strip()
            val = val.strip()
            # Check for upstream_path first (explicit full path)
            mp = re.search(r"upstream_path:\s*([^}#]+)", val)
            if mp:
                upstream_path = mp.group(1).strip().rstrip(",").strip()
                upstream_path = _parse_yaml_value(upstream_path)
                repo["adapted_skills"][catalog_name] = {"upstream_path": upstream_path}
            else:
                # Fall back to upstream_dir
                m = re.search(r"upstream_dir:\s*([^}#]+)", val)
                if m:
                    upstream_dir = m.group(1).strip().rstrip(",").strip()
                    upstream_dir = _parse_yaml_value(upstream_dir)
                else:
                    upstream_dir = catalog_name
                repo["adapted_skills"][catalog_name] = {"upstream_dir": upstream_dir}
            continue

        # Ignored list items (indent 6)
        if indent == 6 and current_section == "ignored":
            if stripped.startswith("- "):
                item = stripped[2:].strip()
                # Strip inline comments
                if "  #" in item:
                    item = item[: item.index("  #")].strip()
                elif "\t#" in item:
                    item = item[: item.index("\t#")].strip()
                repo["ignored"].append(_parse_yaml_value(item))
            continue

    return sources


# ---------------------------------------------------------------------------
# SHA cache management
# ---------------------------------------------------------------------------


def load_cache() -> dict:
    if CACHE_PATH.exists():
        data = json.loads(CACHE_PATH.read_text())
        if data.get("version") == 2:
            return data
        if data.get("version") == 1:
            # Migrate v1 -> v2: add adapted_skills
            data["version"] = 2
            data.setdefault("adapted_skills", {})
            return data
    return {"version": 2, "skills": {}, "adapted_skills": {}}


def save_cache(cache: dict) -> None:
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    CACHE_PATH.write_text(json.dumps(cache, indent=2, sort_keys=True) + "\n")


# ---------------------------------------------------------------------------
# Content helpers
# ---------------------------------------------------------------------------


def sha256(content: str) -> str:
    return hashlib.sha256(content.encode()).hexdigest()


def split_frontmatter(text: str) -> tuple[str, str]:
    """Split SKILL.md into (frontmatter_block, body).

    frontmatter_block includes the --- delimiters.
    body starts after the closing ---.
    """
    lines = text.split("\n")
    if not lines or lines[0].strip() != "---":
        return "", text

    end = -1
    for idx in range(1, len(lines)):
        if lines[idx].strip() == "---":
            end = idx
            break

    if end == -1:
        return "", text

    fm = "\n".join(lines[: end + 1])
    body = "\n".join(lines[end + 1 :])
    return fm, body


def _has_metadata_internal(text: str) -> bool:
    """Check if SKILL.md frontmatter has metadata.internal set to true.

    Uses minimal parsing — scans for 'metadata:' section then looks for
    'internal: true' at one indent level deeper. NOT full YAML parsing.
    """
    fm, _ = split_frontmatter(text)
    if not fm:
        return False

    in_metadata = False
    metadata_indent = -1
    for line in fm.split("\n"):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        indent = _indent_level(line)
        if stripped == "metadata:":
            in_metadata = True
            metadata_indent = indent
            continue
        if in_metadata:
            if indent <= metadata_indent:
                # Left the metadata section
                in_metadata = False
                continue
            if stripped.startswith("internal:"):
                val = _parse_yaml_value(stripped.split(":", 1)[1])
                return val.lower() == "true"
    return False


def extract_section_headings(body: str) -> list[str]:
    """Extract all markdown headings from body text.

    Returns list of heading lines in order, e.g.:
        ["## Overview", "### Setup", "## API Reference"]
    """
    headings = []
    for line in body.split("\n"):
        stripped = line.rstrip()
        if stripped.startswith("#"):
            headings.append(stripped)
    return headings


def diff_section_headings(old_headings: list[str], new_headings: list[str]) -> str:
    """Compare two lists of section headings and return a concise summary.

    Returns a human-readable string for inclusion in reports.
    """
    if old_headings == new_headings:
        return "No structural changes"

    old_set = set(old_headings)
    new_set = set(new_headings)
    added = sorted(new_set - old_set)
    removed = sorted(old_set - new_set)

    if not added and not removed:
        return "No structural changes"

    # For small diffs, list specifics
    if len(added) + len(removed) <= 4:
        parts = []
        if added:
            parts.append("Added: " + ", ".join(f"`{h}`" for h in added))
        if removed:
            parts.append("Removed: " + ", ".join(f"`{h}`" for h in removed))
        return "; ".join(parts)

    # For larger diffs, summarize counts
    parts = []
    if added:
        parts.append(f"+{len(added)} added")
    if removed:
        parts.append(f"-{len(removed)} removed")
    return "Sections: " + ", ".join(parts)


def to_holocene_date(iso_date: str) -> str:
    """Convert ISO date string to Holocene Era YYYYY-MM-DD."""
    dt = datetime.fromisoformat(iso_date.replace("Z", "+00:00"))
    year = dt.year + 10000
    return f"{year:05d}-{dt.month:02d}-{dt.day:02d}"


def update_last_updated(frontmatter: str, new_date: str) -> str:
    """Replace lastUpdated value in frontmatter string."""
    return re.sub(
        r'(lastUpdated:\s*)["\']?\d{5}-\d{2}-\d{2}["\']?',
        rf'\g<1>"{new_date}"',
        frontmatter,
    )


# ---------------------------------------------------------------------------
# GitHub API helpers (via gh CLI)
# ---------------------------------------------------------------------------


def gh_api(
    endpoint: str, accept: str = "application/vnd.github+json", jq: str | None = None
) -> subprocess.CompletedProcess:
    cmd = ["gh", "api", endpoint, "--header", f"Accept: {accept}"]
    if jq:
        cmd += ["--jq", jq]
    return subprocess.run(cmd, capture_output=True, text=True, timeout=60)


def fetch_raw_file(owner_repo: str, ref: str, path: str) -> str | None:
    """Fetch raw file content from GitHub. Returns None on 404."""
    endpoint = f"repos/{owner_repo}/contents/{path}?ref={ref}"
    result = gh_api(endpoint, accept="application/vnd.github.raw+json")
    if result.returncode != 0:
        if "404" in result.stderr or "Not Found" in result.stderr:
            return None
        print(
            f"::warning::gh api failed for {owner_repo}/{path}: {result.stderr.strip()}"
        )
        return None
    return result.stdout


def fetch_last_commit_date(owner_repo: str, ref: str, path: str) -> str | None:
    """Get the last commit date for a file path."""
    endpoint = f"repos/{owner_repo}/commits?path={path}&sha={ref}&per_page=1"
    result = gh_api(endpoint, jq=".[0].commit.committer.date")
    if result.returncode != 0:
        print(
            f"::warning::Failed to get commit date for {owner_repo}/{path}: {result.stderr.strip()}"
        )
        return None
    date_str = result.stdout.strip()
    return date_str if date_str else None


def fetch_repo_tree(owner_repo: str, ref: str) -> list[str]:
    """Fetch all file paths from the repo tree."""
    endpoint = f"repos/{owner_repo}/git/trees/{ref}?recursive=1"
    result = gh_api(endpoint, jq=".tree[].path")
    if result.returncode != 0:
        print(
            f"::error::Failed to fetch tree for {owner_repo}: {result.stderr.strip()}"
        )
        return []
    return [p for p in result.stdout.strip().splitlines() if p]


# ---------------------------------------------------------------------------
# Git helpers
# ---------------------------------------------------------------------------


def git(*args: str, check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["git", *args],
        capture_output=True,
        text=True,
        cwd=REPO_ROOT,
        check=check,
        timeout=60,
    )


# ---------------------------------------------------------------------------
# Core sync logic
# ---------------------------------------------------------------------------


def process_repo(
    owner_repo: str,
    config: dict,
    cache: dict,
    *,
    init: bool = False,
    dry_run: bool = False,
) -> dict:
    """Process a single upstream repo.

    Hybrid behavior:
      - safe ported changes (no local body mods): apply upstream body to local
        file for inclusion in a PR.
      - review ported changes (local body mods exist): do NOT modify local file,
        report in issue for manual review.
      - adapted skills: advisory monitoring only, never modify local files.
      - new upstream skills: report with links.

    Returns a report dict.
    """
    ref = config["ref"]
    discover = config.get("discover", {})
    skills = config.get("skills", {})
    adapted_skills_cfg = config.get("adapted_skills", {})
    ignored = config.get("ignored", [])

    report = {
        "safe": [],  # (catalog_name, new_date)
        "review": [],  # (catalog_name, new_date)
        "deleted": [],  # catalog_name
        "new_skills": [],  # (upstream_dir, skill_url)
        "errors": [],  # message
        "adapted_changed": [],  # (catalog_name, section_diff, history_url)
        "adapted_deleted": [],  # catalog_name
    }

    print(
        f"::group::Processing {owner_repo} (ref={ref}, {len(skills)} ported, {len(adapted_skills_cfg)} adapted)"
    )

    # --- Sync existing ported skills ---
    for catalog_name, skill_cfg in skills.items():
        upstream_dir = skill_cfg.get("upstream_dir", catalog_name)
        root = discover.get("root", "")
        skill_file = discover.get("skill_file", "SKILL.md")
        upstream_path = f"{root}{upstream_dir}/{skill_file}"

        print(f"  Checking {catalog_name} <- {upstream_path}")

        # Fetch upstream content
        upstream_raw = fetch_raw_file(owner_repo, ref, upstream_path)
        if upstream_raw is None:
            print(f"::warning::Upstream file not found: {owner_repo}/{upstream_path}")
            report["deleted"].append(catalog_name)
            continue

        # Strip upstream frontmatter, get body
        _, upstream_body = split_frontmatter(upstream_raw)
        upstream_hash = sha256(upstream_body)

        # Check cache
        cached = cache.get("skills", {}).get(catalog_name, {})
        cached_hash = cached.get("upstream_body_sha256")

        if init:
            # Bootstrap: store hash, don't flag changes
            cache.setdefault("skills", {})[catalog_name] = {
                "upstream_body_sha256": upstream_hash,
                "last_checked": datetime.now(timezone.utc).isoformat(),
            }
            print(f"    [init] Cached hash for {catalog_name}")
            continue

        if cached_hash == upstream_hash:
            # No change — refresh last_checked
            cache.setdefault("skills", {})[catalog_name] = {
                "upstream_body_sha256": upstream_hash,
                "last_checked": datetime.now(timezone.utc).isoformat(),
            }
            continue

        # Change detected!
        print(f"    Change detected for {catalog_name}")

        # Read local file
        local_path = CATALOG_SKILLS / catalog_name / "SKILL.md"
        if not local_path.exists():
            msg = f"Local SKILL.md missing for {catalog_name}"
            print(f"::error::{msg}")
            report["errors"].append(msg)
            continue

        local_raw = local_path.read_text()
        local_fm, local_body = split_frontmatter(local_raw)
        local_body_hash = sha256(local_body)

        # Classify: safe (local matches cache) vs needs-review (local was modified)
        if cached_hash is not None and local_body_hash == cached_hash:
            classification = "safe"
        else:
            classification = "review"

        # Get upstream last commit date for lastUpdated
        commit_date = fetch_last_commit_date(owner_repo, ref, upstream_path)
        if commit_date:
            holocene_date = to_holocene_date(commit_date)
            new_fm = update_last_updated(local_fm, holocene_date)
        else:
            holocene_date = "unknown"
            new_fm = local_fm

        if classification == "safe":
            # Safe: apply upstream body, preserving local frontmatter
            if not dry_run:
                new_content = new_fm + upstream_body
                local_path.write_text(new_content)
            cache.setdefault("skills", {})[catalog_name] = {
                "upstream_body_sha256": upstream_hash,
                "last_checked": datetime.now(timezone.utc).isoformat(),
            }
            report["safe"].append((catalog_name, holocene_date))
            print(f"    [safe] Updated {catalog_name} (lastUpdated: {holocene_date})")
        else:
            # Review: do NOT modify local file, report for manual review
            cache.setdefault("skills", {})[catalog_name] = {
                "upstream_body_sha256": upstream_hash,
                "last_checked": datetime.now(timezone.utc).isoformat(),
            }
            report["review"].append((catalog_name, holocene_date))
            print(
                f"    [review] Change requires review for {catalog_name} (lastUpdated: {holocene_date})"
            )

    # --- Monitor adapted skills (advisory only) ---
    for catalog_name, skill_cfg in adapted_skills_cfg.items():
        root = discover.get("root", "")
        skill_file = discover.get("skill_file", "SKILL.md")

        # Determine upstream path
        if "upstream_path" in skill_cfg:
            upstream_path = skill_cfg["upstream_path"]
        else:
            upstream_dir = skill_cfg.get("upstream_dir", catalog_name)
            upstream_path = f"{root}{upstream_dir}/{skill_file}"

        print(f"  Monitoring adapted {catalog_name} <- {upstream_path}")

        # Fetch upstream content
        upstream_raw = fetch_raw_file(owner_repo, ref, upstream_path)
        if upstream_raw is None:
            print(
                f"::warning::Adapted skill upstream not found: {owner_repo}/{upstream_path}"
            )
            report["adapted_deleted"].append(catalog_name)
            continue

        # Strip upstream frontmatter, get body
        _, upstream_body = split_frontmatter(upstream_raw)
        upstream_hash = sha256(upstream_body)
        new_headings = extract_section_headings(upstream_body)

        # Check cache
        cached = cache.get("adapted_skills", {}).get(catalog_name, {})
        cached_hash = cached.get("upstream_body_sha256")

        if init:
            # Bootstrap: store hash and sections, don't flag changes
            cache.setdefault("adapted_skills", {})[catalog_name] = {
                "upstream_body_sha256": upstream_hash,
                "upstream_sections": new_headings,
                "last_checked": datetime.now(timezone.utc).isoformat(),
            }
            print(f"    [init] Cached adapted hash for {catalog_name}")
            continue

        if cached_hash == upstream_hash:
            # No change — refresh last_checked
            cache.setdefault("adapted_skills", {})[catalog_name] = {
                "upstream_body_sha256": upstream_hash,
                "upstream_sections": new_headings,
                "last_checked": datetime.now(timezone.utc).isoformat(),
            }
            continue

        # Change detected — advisory only, NEVER write to local files
        old_headings = cached.get("upstream_sections", [])
        section_diff = diff_section_headings(old_headings, new_headings)
        history_url = f"https://github.com/{owner_repo}/commits/{ref}/{upstream_path}"

        report["adapted_changed"].append((catalog_name, section_diff, history_url))
        print(
            f"    [advisory] Upstream change in adapted skill {catalog_name}: {section_diff}"
        )

        # Update cache so the same change isn't re-flagged
        cache.setdefault("adapted_skills", {})[catalog_name] = {
            "upstream_body_sha256": upstream_hash,
            "upstream_sections": new_headings,
            "last_checked": datetime.now(timezone.utc).isoformat(),
        }

    # --- Discover new upstream skills ---
    if discover and not init:
        root = discover.get("root", "")
        skill_file = discover.get("skill_file", "SKILL.md")

        print(f"  Discovering new skills in {root}...")
        tree_paths = fetch_repo_tree(owner_repo, ref)

        # Find skill dirs: paths matching {root}<dir>/{skill_file}
        pattern = re.compile(
            re.escape(root) + r"([^/]+)/" + re.escape(skill_file) + "$"
        )
        found_dirs = set()
        for p in tree_paths:
            m = pattern.match(p)
            if m:
                found_dirs.add(m.group(1))

        # Exclude ported skill dirs
        known_dirs = set(s.get("upstream_dir", name) for name, s in skills.items())
        # Exclude adapted skill dirs (those under discover root)
        for name, s in adapted_skills_cfg.items():
            if "upstream_path" in s:
                # upstream_path skills don't live under discover root — skip
                continue
            known_dirs.add(s.get("upstream_dir", name))
        ignored_set = set(ignored)
        new_dirs = found_dirs - known_dirs - ignored_set

        # Filter out skills with metadata.internal: true
        internal_dirs = set()
        for d in new_dirs:
            skill_path = f"{root}{d}/{skill_file}"
            raw = fetch_raw_file(owner_repo, ref, skill_path)
            if raw is not None and _has_metadata_internal(raw):
                print(f"    [skipped:internal] {root}{d}/{skill_file}")
                internal_dirs.add(d)
        new_dirs -= internal_dirs

        if new_dirs:
            report["new_skills"] = [
                (d, f"https://github.com/{owner_repo}/tree/{ref}/{root}{d}")
                for d in sorted(new_dirs)
            ]
            for d, url in report["new_skills"]:
                print(f"    [new] {url}")
    print("::endgroup::")
    return report


def build_pr_body(owner_repo: str, report: dict) -> str:
    """Build PR body markdown from report (safe updates only)."""
    lines = [
        f"## Upstream Sync: {owner_repo}",
        "",
        f"Auto-applied upstream body updates to **{len(report['safe'])}** ported skill(s).",
        "These skills had no local body modifications \u2014 the new upstream body was applied",
        "directly with local frontmatter preserved.",
        "",
        "### Updated Skills",
        "",
    ]
    for name, date in report["safe"]:
        lines.append(f"- `{name}` (lastUpdated: {date})")
    lines.append("")

    return "\n".join(lines)


def build_issue_body(all_reports: dict) -> str:
    """Build consolidated issue body from all repo reports.

    Excludes safe updates (those are handled via auto-PR).
    Use ``python3 .github/upstream-sync/sync.py --diff`` to inspect diffs.
    """
    total_review = sum(len(r["review"]) for r in all_reports.values())
    total_deleted = sum(len(r["deleted"]) for r in all_reports.values())
    total_new = sum(len(r["new_skills"]) for r in all_reports.values())
    total_adapted = sum(len(r.get("adapted_changed", [])) for r in all_reports.values())
    total_adapted_deleted = sum(
        len(r.get("adapted_deleted", [])) for r in all_reports.values()
    )

    date_str = datetime.now(timezone.utc).strftime("1%Y-%m-%d")
    lines = [
        f"## Upstream Sync Report \u2014 {date_str}",
        "",
        "Automated scan detected upstream changes requiring manual review.",
        "",
    ]

    # Note about safe updates handled separately
    total_safe = sum(len(r["safe"]) for r in all_reports.values())
    if total_safe > 0:
        lines.append(
            f"> **Note:** {total_safe} safe update(s) were auto-applied via separate PR(s)."
        )
        lines.append("")

    lines += [
        "### Summary",
        "",
        "| Metric | Count |",
        "|--------|-------|",
        f"| Needs review (ported) | {total_review} |",
        f"| Upstream 404s (ported) | {total_deleted} |",
        f"| New upstream skills | {total_new} |",
        f"| Adapted changes (advisory) | {total_adapted} |",
        f"| Adapted 404s | {total_adapted_deleted} |",
        "",
        "Use `python3 .github/upstream-sync/sync.py --diff` to inspect body diffs locally.",
        "",
    ]

    for owner_repo, report in all_reports.items():
        adapted_changed = report.get("adapted_changed", [])
        adapted_deleted = report.get("adapted_deleted", [])
        has_any = (
            report["review"]
            or report["deleted"]
            or report["new_skills"]
            or adapted_changed
            or adapted_deleted
        )
        if not has_any:
            continue

        lines.append(f"### {owner_repo}")
        lines.append("")

        # Needs review
        if report["review"]:
            lines.append(
                "**Needs Review** (local body modifications exist \u2014 upstream body NOT auto-applied):"
            )
            for name, date in report["review"]:
                lines.append(f"- `{name}` (lastUpdated: {date})")
            lines.append("")

        # New upstream skills (with links)
        if report["new_skills"]:
            lines.append("**New Upstream Skills Detected:**")
            for dir_name, url in report["new_skills"]:
                lines.append(f"- [`{dir_name}`]({url})")
            lines.append("")

        # Upstream deletions
        if report["deleted"]:
            lines.append(
                "**Upstream Deletions (404)** \u2014 these skills were NOT auto-deleted:"
            )
            for name in report["deleted"]:
                lines.append(f"- `{name}`")
            lines.append("")

        # Adapted skill changes (advisory)
        if adapted_changed or adapted_deleted:
            lines.append("**Adapted Skill Upstream Changes (advisory):**")
            lines.append(
                "These adapted skills have upstream body changes. Review manually \u2014 auto-sync is not applied."
            )
            lines.append("")
            for name, section_diff, history_url in adapted_changed:
                lines.append(
                    f"- `{name}` \u2014 {section_diff} ([history]({history_url}))"
                )
            for name in adapted_deleted:
                lines.append(f"- `{name}` \u2014 upstream returned 404")
            lines.append("")

    return "\n".join(lines)


def create_consolidated_issue(
    all_reports: dict,
    *,
    dry_run: bool = False,
) -> None:
    """Create a single GitHub issue summarizing non-safe upstream changes.

    Skips creation if no non-safe changes detected or an open issue already exists.
    """
    # Check if there are any non-safe findings
    has_findings = any(
        r["review"]
        or r["deleted"]
        or r["new_skills"]
        or r.get("adapted_changed")
        or r.get("adapted_deleted")
        for r in all_reports.values()
    )
    if not has_findings:
        print("  No non-safe upstream changes detected \u2014 skipping issue creation")
        return

    body = build_issue_body(all_reports)

    if dry_run:
        print("  [dry-run] Would create issue with body:")
        print(body)
        return

    # Check for existing open issue with upstream-sync label
    check_result = subprocess.run(
        [
            "gh",
            "issue",
            "list",
            "--label",
            "upstream-sync",
            "--state",
            "open",
            "--json",
            "number",
        ],
        capture_output=True,
        text=True,
        timeout=30,
    )
    existing = json.loads(check_result.stdout) if check_result.returncode == 0 else []
    if existing:
        print(
            f"  Open upstream-sync issue already exists (#{existing[0]['number']}), skipping"
        )
        return

    # Create issue
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    issue_result = subprocess.run(
        [
            "gh",
            "issue",
            "create",
            "--title",
            f"Upstream sync report \u2014 {date_str}",
            "--body",
            body,
            "--label",
            "upstream-sync",
        ],
        capture_output=True,
        text=True,
        timeout=30,
    )
    if issue_result.returncode == 0:
        print(f"  Issue created: {issue_result.stdout.strip()}")
    else:
        print(f"::error::Issue creation failed: {issue_result.stderr.strip()}")


def create_pr_for_repo(
    owner_repo: str,
    report: dict,
    *,
    dry_run: bool = False,
) -> None:
    """Create a branch, commit safe changes, and open a PR for one upstream repo."""
    has_safe = bool(report["safe"])
    if not has_safe:
        return

    repo_slug = owner_repo.replace("/", "-")
    date_str = datetime.now(timezone.utc).strftime("1%Y-%m-%d")
    branch = f"chore/upstream-sync/{repo_slug}/{date_str}"

    if dry_run:
        print(f"  [dry-run] Would create branch: {branch}")
        pr_body = build_pr_body(owner_repo, report)
        print(f"  [dry-run] PR body:\n{pr_body}")
        return

    # Ensure we're on main and up to date
    git("checkout", "main", check=False)

    # Delete branch if it exists locally (re-run scenario)
    git("branch", "-D", branch, check=False)

    # Create branch
    result = git("checkout", "-b", branch, check=False)
    if result.returncode != 0:
        print(f"::error::Failed to create branch {branch}: {result.stderr.strip()}")
        return

    # Stage changed skill files (safe items only)
    changed_skills = [name for name, _ in report["safe"]]
    for name in changed_skills:
        skill_path = f"catalog/skills/{name}/SKILL.md"
        git("add", skill_path)

    # Stage updated cache
    cache_rel = str(CACHE_PATH.relative_to(REPO_ROOT))
    git("add", cache_rel)

    # Commit
    commit_msg = f"chore(catalog): sync ported skills from {owner_repo}"
    result = git("commit", "-m", commit_msg, check=False)
    if result.returncode != 0:
        print(f"::error::Commit failed: {result.stderr.strip()}")
        git("checkout", "main", check=False)
        return

    # Push
    result = git("push", "origin", branch, "--force", check=False)
    if result.returncode != 0:
        print(f"::error::Push failed: {result.stderr.strip()}")
        git("checkout", "main", check=False)
        return

    # Check for existing PR
    check_pr = subprocess.run(
        ["gh", "pr", "list", "--head", branch, "--state", "open", "--json", "number"],
        capture_output=True,
        text=True,
        timeout=30,
    )
    existing = json.loads(check_pr.stdout) if check_pr.returncode == 0 else []

    if not existing:
        pr_body = build_pr_body(owner_repo, report)
        pr_result = subprocess.run(
            [
                "gh",
                "pr",
                "create",
                "--title",
                f"chore(catalog): sync ported skills from {owner_repo}",
                "--body",
                pr_body,
                "--base",
                "main",
                "--head",
                branch,
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if pr_result.returncode == 0:
            print(f"  PR created: {pr_result.stdout.strip()}")
        else:
            print(f"::error::PR creation failed: {pr_result.stderr.strip()}")
    else:
        print(f"  PR already exists for {branch} (#{existing[0]['number']})")

    # Return to main for next repo
    git("checkout", "main", check=False)


# ---------------------------------------------------------------------------
# Manual diff inspection (--diff)
# ---------------------------------------------------------------------------


def _print_skill_diff(
    owner_repo: str,
    ref: str,
    upstream_path: str,
    catalog_name: str,
    provenance: str,
) -> None:
    """Fetch upstream and print unified diff for one skill."""
    header = f"=== {catalog_name} ({provenance}) \u2014 {owner_repo} ==="

    # Read local file
    local_path = CATALOG_SKILLS / catalog_name / "SKILL.md"
    if not local_path.exists():
        print(header)
        print(f"  Local file not found: {local_path}")
        print()
        return

    local_raw = local_path.read_text()
    _, local_body = split_frontmatter(local_raw)

    # Fetch upstream
    upstream_raw = fetch_raw_file(owner_repo, ref, upstream_path)
    if upstream_raw is None:
        print(header)
        print(f"  Upstream not found: {owner_repo}/{upstream_path} (404)")
        print()
        return

    _, upstream_body = split_frontmatter(upstream_raw)

    # Compare
    if sha256(local_body) == sha256(upstream_body):
        print(header)
        print("  No changes")
        print()
        return

    # Generate and print diff
    local_lines = local_body.splitlines(keepends=True)
    upstream_lines = upstream_body.splitlines(keepends=True)
    diff = difflib.unified_diff(
        local_lines,
        upstream_lines,
        fromfile=f"catalog/skills/{catalog_name}/SKILL.md (local body)",
        tofile=f"{upstream_path} ({owner_repo}@{ref})",
    )

    print(header)
    for line in diff:
        print(line, end="")
    print()


def diff_skills(
    sources: dict,
    *,
    skill_filter: str | None = None,
) -> None:
    """Print unified diffs between local catalog bodies and upstream bodies.

    Read-only inspection — no files are modified, no cache is updated.
    """
    found_any = False

    for owner_repo, config in sources.items():
        ref = config["ref"]
        discover = config.get("discover", {})
        skills = config.get("skills", {})
        adapted_skills_cfg = config.get("adapted_skills", {})

        # Process ported skills
        for catalog_name, skill_cfg in skills.items():
            if skill_filter and catalog_name != skill_filter:
                continue

            upstream_dir = skill_cfg.get("upstream_dir", catalog_name)
            root = discover.get("root", "")
            skill_file = discover.get("skill_file", "SKILL.md")
            upstream_path = f"{root}{upstream_dir}/{skill_file}"

            _print_skill_diff(owner_repo, ref, upstream_path, catalog_name, "ported")
            found_any = True

        # Process adapted skills
        for catalog_name, skill_cfg in adapted_skills_cfg.items():
            if skill_filter and catalog_name != skill_filter:
                continue

            root = discover.get("root", "")
            skill_file = discover.get("skill_file", "SKILL.md")

            if "upstream_path" in skill_cfg:
                upstream_path = skill_cfg["upstream_path"]
            else:
                upstream_dir = skill_cfg.get("upstream_dir", catalog_name)
                upstream_path = f"{root}{upstream_dir}/{skill_file}"

            _print_skill_diff(owner_repo, ref, upstream_path, catalog_name, "adapted")
            found_any = True

    if not found_any:
        if skill_filter:
            print(f"Skill '{skill_filter}' not found in upstream-sources.yaml")
        else:
            print("No skills to diff")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Sync ported catalog skills from upstream repos"
    )
    parser.add_argument(
        "--init",
        action="store_true",
        help="Populate SHA cache without creating PRs or issues (first-run bootstrap)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would change without modifying files or creating PRs/issues",
    )
    parser.add_argument(
        "--repo",
        type=str,
        default=None,
        help="Process only one upstream repo (e.g., openclaw/openclaw)",
    )
    parser.add_argument(
        "--diff",
        action="store_true",
        help="Show unified diff between local and upstream body for tracked skills (read-only)",
    )
    parser.add_argument(
        "--skill",
        type=str,
        default=None,
        help="Filter to specific skill by catalog name (used with --diff)",
    )
    args = parser.parse_args()

    if args.skill and not args.diff:
        parser.error("--skill can only be used with --diff")

    # Load config
    if not CONFIG_PATH.exists():
        print(f"::error::Config not found: {CONFIG_PATH}")
        sys.exit(1)

    sources = parse_upstream_sources(CONFIG_PATH)
    if not sources:
        print("::error::No sources found in upstream-sources.yaml")
        sys.exit(1)

    # Filter to single repo if requested
    if args.repo:
        if args.repo not in sources:
            print(
                f"::error::Repo '{args.repo}' not found in config. Available: {', '.join(sources.keys())}"
            )
            sys.exit(1)
        sources = {args.repo: sources[args.repo]}

    # Diff mode: read-only inspection, then exit
    if args.diff:
        diff_skills(sources, skill_filter=args.skill)
        return

    print(f"Loaded {len(sources)} upstream source(s)")

    # Load cache
    cache = load_cache()

    # Process each repo
    all_reports = {}
    for owner_repo, config in sources.items():
        report = process_repo(
            owner_repo,
            config,
            cache,
            init=args.init,
            dry_run=args.dry_run,
        )
        all_reports[owner_repo] = report

    # Save cache
    if not args.dry_run:
        save_cache(cache)

    # Create PRs for safe changes and issue for non-safe findings
    if not args.init:
        for owner_repo, report in all_reports.items():
            create_pr_for_repo(owner_repo, report, dry_run=args.dry_run)
        create_consolidated_issue(all_reports, dry_run=args.dry_run)

    # Summary
    print("\n::group::Summary")
    total_safe = sum(len(r["safe"]) for r in all_reports.values())
    total_review = sum(len(r["review"]) for r in all_reports.values())
    total_deleted = sum(len(r["deleted"]) for r in all_reports.values())
    total_new = sum(len(r["new_skills"]) for r in all_reports.values())
    total_adapted = sum(len(r.get("adapted_changed", [])) for r in all_reports.values())
    total_adapted_deleted = sum(
        len(r.get("adapted_deleted", [])) for r in all_reports.values()
    )

    if args.init:
        total_cached = sum(len(cfg.get("skills", {})) for cfg in sources.values())
        total_adapted_cached = sum(
            len(cfg.get("adapted_skills", {})) for cfg in sources.values()
        )
        print(f"Initialized SHA cache for {total_cached} ported skill(s)")
        print(f"Initialized SHA cache for {total_adapted_cached} adapted skill(s)")
    else:
        print(f"Safe updates (PR): {total_safe}")
        print(f"Needs review:      {total_review}")
        print(f"Upstream 404s:     {total_deleted}")
        print(f"New skills found:  {total_new}")
        print(f"Adapted changes:   {total_adapted} (advisory)")
        print(f"Adapted 404s:      {total_adapted_deleted}")

    if total_new > 0:
        print("\nNew upstream skills detected:")
        for repo, report in all_reports.items():
            for d, url in report.get("new_skills", []):
                print(f"  {repo}: {d} -> {url}")

    print("::endgroup::")


if __name__ == "__main__":
    main()
