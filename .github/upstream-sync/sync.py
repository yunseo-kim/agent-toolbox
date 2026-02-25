#!/usr/bin/env python3
"""Upstream sync for ported catalog skills.

Checks upstream repositories for body content changes in ported skills,
applies updates preserving local frontmatter, and detects new upstream skills.

Requirements: Python 3.10+ stdlib only. Runs on GitHub Actions with `gh` CLI.
"""

from __future__ import annotations

import argparse
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
                "ignored": ["dir1", ...]
            },
            ...
        }
    """
    lines = path.read_text().splitlines()
    sources: dict = {}
    current_repo = None
    current_section = None  # "skills" | "ignored" | "discover" | None
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
        if data.get("version") == 1:
            return data
    return {"version": 1, "skills": {}}


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
    """Process a single upstream repo. Returns a report dict."""
    ref = config["ref"]
    discover = config.get("discover", {})
    skills = config.get("skills", {})
    ignored = config.get("ignored", [])

    report = {
        "safe": [],  # (catalog_name, new_date)
        "review": [],  # (catalog_name, new_date)
        "deleted": [],  # catalog_name
        "new_skills": [],  # upstream_dir
        "errors": [],  # message
    }

    print(f"::group::Processing {owner_repo} (ref={ref}, {len(skills)} skills)")

    # --- Sync existing skills ---
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
            # No change
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

        if not dry_run:
            # Write updated file: our frontmatter + upstream body
            new_content = new_fm + upstream_body
            local_path.write_text(new_content)

        # Update cache
        cache.setdefault("skills", {})[catalog_name] = {
            "upstream_body_sha256": upstream_hash,
            "last_checked": datetime.now(timezone.utc).isoformat(),
        }

        if classification == "safe":
            report["safe"].append((catalog_name, holocene_date))
        else:
            report["review"].append((catalog_name, holocene_date))

        print(
            f"    [{classification}] Updated {catalog_name} (lastUpdated: {holocene_date})"
        )

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

        known_dirs = set(s.get("upstream_dir", name) for name, s in skills.items())
        ignored_set = set(ignored)
        new_dirs = found_dirs - known_dirs - ignored_set

        if new_dirs:
            report["new_skills"] = sorted(new_dirs)
            for d in sorted(new_dirs):
                print(f"    [new] {root}{d}/{skill_file}")

    print("::endgroup::")
    return report


def build_pr_body(owner_repo: str, report: dict) -> str:
    """Build PR body markdown from report."""
    total = len(report["safe"]) + len(report["review"])
    lines = [
        f"## Upstream Sync: {owner_repo}",
        "",
        f"Detected upstream changes in **{total}** ported skill(s).",
        "",
    ]

    # Safe updates
    lines.append("### Safe Updates (no local modifications)")
    lines.append("These skills had body content identical to the last-known upstream.")
    lines.append("The new upstream body was applied directly.")
    lines.append("")
    if report["safe"]:
        for name, date in report["safe"]:
            lines.append(f"- `{name}` (lastUpdated: {date})")
    else:
        lines.append("None")
    lines.append("")

    # Needs review
    lines.append("### Needs Review (local modifications exist)")
    lines.append(
        "These skills had local body modifications. The upstream body has been applied --"
    )
    lines.append(
        "**review the diff carefully** to verify no important local changes were lost."
    )
    lines.append("")
    if report["review"]:
        for name, date in report["review"]:
            lines.append(f"- `{name}` (lastUpdated: {date})")
    else:
        lines.append("None")
    lines.append("")

    # New upstream skills
    lines.append("### New Upstream Skills Detected")
    lines.append(
        "The following skill directories were found upstream but are not yet in our catalog:"
    )
    lines.append("")
    if report["new_skills"]:
        for d in report["new_skills"]:
            lines.append(f"- `{d}`")
    else:
        lines.append("None")
    lines.append("")

    # Upstream deletions
    lines.append("### Upstream Deletions")
    lines.append("These skills returned 404 from upstream. They were NOT auto-deleted.")
    lines.append("")
    if report["deleted"]:
        for name in report["deleted"]:
            lines.append(f"- `{name}`")
    else:
        lines.append("None")

    return "\n".join(lines)


def create_pr_for_repo(
    owner_repo: str,
    report: dict,
    *,
    dry_run: bool = False,
) -> None:
    """Create a branch, commit changes, and open a PR for one upstream repo."""
    has_changes = report["safe"] or report["review"]
    if not has_changes:
        if report["new_skills"]:
            print(
                f"  New upstream skills found in {owner_repo} but no content changes to PR."
            )
            print(f"  New skills: {', '.join(report['new_skills'])}")
        return

    repo_slug = owner_repo.replace("/", "-")
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
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

    # Stage changed skill files
    changed_skills = [name for name, _ in report["safe"]] + [
        name for name, _ in report["review"]
    ]
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
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Sync ported catalog skills from upstream repos"
    )
    parser.add_argument(
        "--init",
        action="store_true",
        help="Populate SHA cache without creating PRs (first-run bootstrap)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would change without modifying files or creating PRs",
    )
    parser.add_argument(
        "--repo",
        type=str,
        default=None,
        help="Process only one upstream repo (e.g., openclaw/openclaw)",
    )
    args = parser.parse_args()

    # Load config
    if not CONFIG_PATH.exists():
        print(f"::error::Config not found: {CONFIG_PATH}")
        sys.exit(1)

    sources = parse_upstream_sources(CONFIG_PATH)
    if not sources:
        print("::error::No sources found in upstream-sources.yaml")
        sys.exit(1)

    print(f"Loaded {len(sources)} upstream source(s)")

    # Filter to single repo if requested
    if args.repo:
        if args.repo not in sources:
            print(
                f"::error::Repo '{args.repo}' not found in config. Available: {', '.join(sources.keys())}"
            )
            sys.exit(1)
        sources = {args.repo: sources[args.repo]}

    # Load cache
    cache = load_cache()

    # Process each repo
    all_reports = {}
    for owner_repo, config in sources.items():
        report = process_repo(
            owner_repo, config, cache, init=args.init, dry_run=args.dry_run
        )
        all_reports[owner_repo] = report

    # Save cache (even on dry-run we update last_checked timestamps)
    if not args.dry_run:
        save_cache(cache)

    # Create PRs (one per repo with changes)
    if not args.init:
        for owner_repo, report in all_reports.items():
            create_pr_for_repo(owner_repo, report, dry_run=args.dry_run)

    # Summary
    print("\n::group::Summary")
    total_safe = sum(len(r["safe"]) for r in all_reports.values())
    total_review = sum(len(r["review"]) for r in all_reports.values())
    total_deleted = sum(len(r["deleted"]) for r in all_reports.values())
    total_new = sum(len(r["new_skills"]) for r in all_reports.values())

    if args.init:
        total_cached = sum(len(cfg.get("skills", {})) for cfg in sources.values())
        print(f"Initialized SHA cache for {total_cached} skill(s)")
    else:
        print(f"Safe updates:     {total_safe}")
        print(f"Needs review:     {total_review}")
        print(f"Upstream 404s:    {total_deleted}")
        print(f"New skills found: {total_new}")

    if total_new > 0:
        print("\nNew upstream skills detected:")
        for repo, report in all_reports.items():
            for d in report.get("new_skills", []):
                print(f"  {repo}: {d}")

    print("::endgroup::")


if __name__ == "__main__":
    main()
