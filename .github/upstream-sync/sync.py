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
import base64
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
LOCAL_ONLY_FILES = {"NOTICE.md", "LICENSE", "LICENSE.md", "LICENSE.txt"}

BINARY_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".ico",
    ".bmp",
    ".webp",
    ".woff",
    ".woff2",
    ".ttf",
    ".otf",
    ".eot",
    ".pdf",
    ".zip",
    ".tar",
    ".gz",
    ".bz2",
    ".7z",
    ".pyc",
    ".pyo",
    ".so",
    ".dll",
    ".dylib",
}

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
                "skills": {"catalog-name": {"upstream_dir": "dir-name", "exclude_files": ["path"]}, ...},
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

        # Skill entries (indent 6) — inline flow mapping:
        # name: { upstream_dir: value, exclude_files: [path1, path2] }
        if indent == 6 and current_section == "skills":
            key, _, val = stripped.partition(":")
            catalog_name = key.strip()
            val = val.strip()
            # Parse inline upstream_dir and optional exclude_files list.
            m = re.search(r"upstream_dir:\s*([^,}#]+)", val)
            if m:
                upstream_dir = m.group(1).strip().rstrip(",").strip()
                upstream_dir = _parse_yaml_value(upstream_dir)
            else:
                upstream_dir = catalog_name

            exclude_files: list[str] = []
            ex = re.search(r"exclude_files:\s*\[([^\]]*)\]", val)
            if ex:
                raw_list = ex.group(1).strip()
                if raw_list:
                    for item in raw_list.split(","):
                        item = item.strip()
                        if not item:
                            continue
                        exclude_files.append(_parse_yaml_value(item))

            repo["skills"][catalog_name] = {"upstream_dir": upstream_dir}
            if exclude_files:
                repo["skills"][catalog_name]["exclude_files"] = exclude_files
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
        if data.get("version") == 3:
            return data
        if data.get("version") == 1:
            # Migrate v1 -> v2: add adapted_skills
            data["version"] = 2
            data.setdefault("adapted_skills", {})
        if data.get("version") == 2:
            for entry in data.get("skills", {}).values():
                entry.setdefault("file_hashes", {})
                entry.setdefault("tree_shas", {})
            for entry in data.get("adapted_skills", {}).values():
                entry.setdefault("file_hashes", {})
                entry.setdefault("tree_shas", {})
            data["version"] = 3
            return data
    return {"version": 3, "skills": {}, "adapted_skills": {}}


def save_cache(cache: dict) -> None:
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    CACHE_PATH.write_text(json.dumps(cache, indent=2, sort_keys=True) + "\n")


# ---------------------------------------------------------------------------
# Content helpers
# ---------------------------------------------------------------------------


def sha256(content: str) -> str:
    return hashlib.sha256(content.encode()).hexdigest()


def sha256_bytes(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


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


def fetch_repo_tree(owner_repo: str, ref: str) -> dict[str, str]:
    """Fetch all blob paths and tree SHAs from the repo tree."""
    endpoint = f"repos/{owner_repo}/git/trees/{ref}?recursive=1"
    result = gh_api(
        endpoint,
        jq='.tree[] | select(.type == "blob") | "\\(.path)\\t\\(.sha)"',
    )
    if result.returncode != 0:
        print(
            f"::error::Failed to fetch tree for {owner_repo}: {result.stderr.strip()}"
        )
        return {}
    files: dict[str, str] = {}
    for line in result.stdout.strip().splitlines():
        if not line:
            continue
        path, sep, tree_sha = line.partition("\t")
        if not sep or not path or not tree_sha:
            continue
        files[path] = tree_sha
    return files


def list_skill_files(tree: dict[str, str], prefix: str) -> dict[str, str]:
    """Return {relative_path: sha1} for files under prefix, excluding local-only files."""
    files: dict[str, str] = {}
    for path, tree_sha in tree.items():
        if not path.startswith(prefix):
            continue
        rel_path = path[len(prefix) :]
        if not rel_path:
            continue
        if os.path.basename(rel_path) in LOCAL_ONLY_FILES:
            continue
        files[rel_path] = tree_sha
    return files


def is_binary_file(path: str) -> bool:
    """Check if file has a binary extension."""
    return Path(path).suffix.lower() in BINARY_EXTENSIONS


def fetch_raw_binary(owner_repo: str, ref: str, path: str) -> bytes | None:
    """Fetch binary file content from GitHub via JSON contents API + base64.

    Uses the default JSON response (which base64-encodes content) instead of
    the raw accept header, because ``gh`` CLI's Go text/transform layer
    corrupts genuine binary payloads with 'transform: short source buffer'.
    """
    endpoint = "repos/{}/contents/{}?ref={}".format(owner_repo, path, ref)
    cmd = ["gh", "api", endpoint, "--jq", ".content"]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if result.returncode != 0:
        stderr = result.stderr
        if "404" in stderr or "Not Found" in stderr:
            return None
        print(
            "::warning::gh api failed for {}/{}: {}".format(
                owner_repo, path, stderr.strip()
            )
        )
        return None
    raw_b64 = result.stdout.strip()
    if not raw_b64:
        return None
    try:
        return base64.b64decode(raw_b64)
    except Exception as exc:
        print(
            "::warning::base64 decode failed for {}/{}: {}".format(
                owner_repo, path, exc
            )
        )
        return None


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


def sync_skill_files(
    owner_repo: str,
    ref: str,
    tree: dict[str, str],
    root: str,
    upstream_dir: str,
    skill_file: str,
    catalog_name: str,
    cached_entry: dict,
    *,
    init: bool = False,
    dry_run: bool = False,
    upstream_path: str | None = None,
    exclude_files: list[str] | None = None,
) -> tuple[str, dict]:
    """Sync non-SKILL.md files for a skill and return classification + changes."""
    if upstream_path:
        if "/" in upstream_path:
            prefix = upstream_path.rsplit("/", 1)[0] + "/"
        else:
            prefix = ""
    else:
        prefix = "{}{}{}".format(root, upstream_dir, "/")

    exclude_set = set(exclude_files or [])

    upstream_files = list_skill_files(tree, prefix)
    if exclude_set:
        upstream_files = {
            rel_path: tree_sha
            for rel_path, tree_sha in upstream_files.items()
            if rel_path not in exclude_set
        }
    upstream_files.pop(skill_file, None)

    file_changes = {
        "skill_md_changed": False,
        "files_added": [],
        "files_modified": [],
        "files_deleted": [],
    }

    cached_hashes = dict(cached_entry.get("file_hashes") or {})
    cached_tree_shas = dict(cached_entry.get("tree_shas") or {})
    next_hashes: dict[str, str] = {}
    next_tree_shas: dict[str, str] = {}

    has_safe = False
    has_review = False
    local_root = CATALOG_SKILLS / catalog_name

    for rel_path in sorted(upstream_files.keys()):
        tree_sha = upstream_files[rel_path]
        next_tree_shas[rel_path] = tree_sha
        if cached_tree_shas.get(rel_path) == tree_sha and rel_path in cached_hashes:
            next_hashes[rel_path] = cached_hashes[rel_path]
            continue

        full_upstream_path = prefix + rel_path
        if is_binary_file(rel_path):
            upstream_bytes = fetch_raw_binary(owner_repo, ref, full_upstream_path)
            if upstream_bytes is None:
                continue
            upstream_hash = sha256_bytes(upstream_bytes)
            write_payload_text: str | None = None
            write_payload_bytes: bytes | None = upstream_bytes
        else:
            upstream_text = fetch_raw_file(owner_repo, ref, full_upstream_path)
            if upstream_text is None:
                continue
            upstream_hash = sha256(upstream_text)
            write_payload_text = upstream_text
            write_payload_bytes = None

        next_hashes[rel_path] = upstream_hash
        old_hash = cached_hashes.get(rel_path)

        if init:
            continue

        local_path = local_root / rel_path
        if old_hash is None:
            if local_path.exists():
                if is_binary_file(rel_path):
                    local_hash = sha256_bytes(local_path.read_bytes())
                else:
                    local_hash = sha256(local_path.read_text())
                if local_hash == upstream_hash:
                    continue
                has_review = True
                file_changes["files_modified"].append(rel_path)
            else:
                has_safe = True
                file_changes["files_added"].append(rel_path)
                if not dry_run:
                    local_path.parent.mkdir(parents=True, exist_ok=True)
                    if write_payload_bytes is not None:
                        local_path.write_bytes(write_payload_bytes)
                    else:
                        local_path.write_text(write_payload_text or "")
            continue

        if old_hash == upstream_hash:
            continue

        local_hash: str | None = None
        if local_path.exists():
            if is_binary_file(rel_path):
                local_hash = sha256_bytes(local_path.read_bytes())
            else:
                local_hash = sha256(local_path.read_text())

        if local_hash == old_hash:
            has_safe = True
            file_changes["files_modified"].append(rel_path)
            if not dry_run:
                local_path.parent.mkdir(parents=True, exist_ok=True)
                if write_payload_bytes is not None:
                    local_path.write_bytes(write_payload_bytes)
                else:
                    local_path.write_text(write_payload_text or "")
        else:
            has_review = True
            file_changes["files_modified"].append(rel_path)

    for rel_path in sorted(cached_hashes.keys()):
        if rel_path in exclude_set:
            continue
        if os.path.basename(rel_path) in LOCAL_ONLY_FILES:
            continue
        if rel_path == skill_file:
            continue
        if rel_path in upstream_files:
            continue
        if init:
            continue

        old_hash = cached_hashes[rel_path]
        local_path = local_root / rel_path
        local_hash: str | None = None
        if local_path.exists():
            if is_binary_file(rel_path):
                local_hash = sha256_bytes(local_path.read_bytes())
            else:
                local_hash = sha256(local_path.read_text())

        if local_hash == old_hash:
            has_safe = True
            file_changes["files_deleted"].append(rel_path)
            if not dry_run and local_path.exists():
                os.remove(local_path)
        else:
            has_review = True
            file_changes["files_deleted"].append(rel_path)

    cached_entry["file_hashes"] = next_hashes
    cached_entry["tree_shas"] = next_tree_shas

    if has_review:
        return "review", file_changes
    if has_safe:
        return "safe", file_changes
    return "unchanged", file_changes


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
        "safe": [],
        "review": [],
        "deleted": [],
        "new_skills": [],
        "errors": [],
        "adapted_changed": [],
        "adapted_deleted": [],
    }

    repo_tree = fetch_repo_tree(owner_repo, ref)

    print(
        f"::group::Processing {owner_repo} (ref={ref}, {len(skills)} ported, {len(adapted_skills_cfg)} adapted)"
    )

    # --- Sync existing ported skills ---
    for catalog_name, skill_cfg in skills.items():
        upstream_dir = skill_cfg.get("upstream_dir", catalog_name)
        exclude_files = skill_cfg.get("exclude_files", [])
        root = discover.get("root", "")
        skill_file = discover.get("skill_file", "SKILL.md")
        upstream_path = f"{root}{upstream_dir}/{skill_file}"
        now = datetime.now(timezone.utc).isoformat()

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
        cached_entry = {
            "upstream_body_sha256": cached_hash,
            "last_checked": now,
            "file_hashes": dict(cached.get("file_hashes") or {}),
            "tree_shas": dict(cached.get("tree_shas") or {}),
        }

        file_classification, file_changes = sync_skill_files(
            owner_repo,
            ref,
            repo_tree,
            root,
            upstream_dir,
            skill_file,
            catalog_name,
            cached_entry,
            init=init,
            dry_run=dry_run,
            exclude_files=exclude_files,
        )

        if init:
            cached_entry["upstream_body_sha256"] = upstream_hash
            cached_entry["last_checked"] = now
            cache.setdefault("skills", {})[catalog_name] = cached_entry
            print(f"    [init] Cached hash for {catalog_name}")
            continue

        body_changed = cached_hash != upstream_hash
        classification = "unchanged"
        holocene_date = "unknown"

        if body_changed:
            print(f"    Change detected for {catalog_name}")
            local_path = CATALOG_SKILLS / catalog_name / "SKILL.md"
            if not local_path.exists():
                msg = f"Local SKILL.md missing for {catalog_name}"
                print(f"::error::{msg}")
                report["errors"].append(msg)
                cached_entry["upstream_body_sha256"] = upstream_hash
                cached_entry["last_checked"] = now
                cache.setdefault("skills", {})[catalog_name] = cached_entry
                continue

            local_raw = local_path.read_text()
            local_fm, local_body = split_frontmatter(local_raw)
            local_body_hash = sha256(local_body)

            if cached_hash is not None and local_body_hash == cached_hash:
                classification = "safe"
            else:
                classification = "review"

            commit_date = fetch_last_commit_date(owner_repo, ref, upstream_path)
            if commit_date:
                holocene_date = to_holocene_date(commit_date)
                new_fm = update_last_updated(local_fm, holocene_date)
            else:
                new_fm = local_fm

            if classification == "safe" and not dry_run:
                local_path.write_text(new_fm + upstream_body)

        if file_classification == "review" or classification == "review":
            overall = "review"
        elif file_classification == "safe" or classification == "safe":
            overall = "safe"
        else:
            overall = "unchanged"

        file_changes["skill_md_changed"] = bool(body_changed)
        cached_entry["upstream_body_sha256"] = upstream_hash
        cached_entry["last_checked"] = now
        cache.setdefault("skills", {})[catalog_name] = cached_entry

        if overall == "safe":
            report["safe"].append(
                {
                    "name": catalog_name,
                    "date": holocene_date,
                    "file_changes": file_changes,
                }
            )
            print(f"    [safe] Updated {catalog_name} (lastUpdated: {holocene_date})")
        elif overall == "review":
            report["review"].append(
                {
                    "name": catalog_name,
                    "date": holocene_date,
                    "file_changes": file_changes,
                }
            )
            print(
                f"    [review] Change requires review for {catalog_name} (lastUpdated: {holocene_date})"
            )

    # --- Monitor adapted skills (advisory only) ---
    for catalog_name, skill_cfg in adapted_skills_cfg.items():
        root = discover.get("root", "")
        skill_file = discover.get("skill_file", "SKILL.md")
        now = datetime.now(timezone.utc).isoformat()

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
        cached_entry = {
            "upstream_body_sha256": cached_hash,
            "upstream_sections": cached.get("upstream_sections", []),
            "last_checked": now,
            "file_hashes": dict(cached.get("file_hashes") or {}),
            "tree_shas": dict(cached.get("tree_shas") or {}),
        }

        monitor_upstream_path = skill_cfg.get("upstream_path")
        monitor_upstream_dir = skill_cfg.get("upstream_dir", catalog_name)
        monitor_exclude_files = skill_cfg.get("exclude_files", [])
        file_classification, file_changes = sync_skill_files(
            owner_repo,
            ref,
            repo_tree,
            root,
            monitor_upstream_dir,
            skill_file,
            catalog_name,
            cached_entry,
            init=init,
            dry_run=True,
            upstream_path=monitor_upstream_path,
            exclude_files=monitor_exclude_files,
        )

        if init:
            cached_entry["upstream_body_sha256"] = upstream_hash
            cached_entry["upstream_sections"] = new_headings
            cached_entry["last_checked"] = now
            cache.setdefault("adapted_skills", {})[catalog_name] = cached_entry
            print(f"    [init] Cached adapted hash for {catalog_name}")
            continue

        body_changed = cached_hash != upstream_hash
        if body_changed or file_classification != "unchanged":
            old_headings = cached.get("upstream_sections", [])
            section_diff = diff_section_headings(old_headings, new_headings)
            history_url = (
                f"https://github.com/{owner_repo}/commits/{ref}/{upstream_path}"
            )
            file_changes["skill_md_changed"] = bool(body_changed)
            report["adapted_changed"].append(
                {
                    "name": catalog_name,
                    "section_diff": section_diff,
                    "url": history_url,
                    "file_changes": file_changes,
                }
            )
            print(
                f"    [advisory] Upstream change in adapted skill {catalog_name}: {section_diff}"
            )

        cached_entry["upstream_body_sha256"] = upstream_hash
        cached_entry["upstream_sections"] = new_headings
        cached_entry["last_checked"] = now
        cache.setdefault("adapted_skills", {})[catalog_name] = cached_entry

    # --- Discover new upstream skills ---
    if discover and not init:
        root = discover.get("root", "")
        skill_file = discover.get("skill_file", "SKILL.md")

        print(f"  Discovering new skills in {root}...")

        # Find skill dirs: paths matching {root}<dir>/{skill_file}
        pattern = re.compile(
            re.escape(root) + r"([^/]+)/" + re.escape(skill_file) + "$"
        )
        found_dirs = set()
        for p in repo_tree.keys():
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
                {
                    "dir": d,
                    "url": f"https://github.com/{owner_repo}/tree/{ref}/{root}{d}",
                }
                for d in sorted(new_dirs)
            ]
            for item in report["new_skills"]:
                print("    [new] {}".format(item["url"]))
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
    for item in report["safe"]:
        name = item["name"]
        date = item["date"]
        changes = item.get("file_changes", {})
        lines.append(f"- `{name}` (lastUpdated: {date})")
        if changes.get("skill_md_changed"):
            lines.append("  - Modified: `SKILL.md` body")
        if changes.get("files_modified"):
            lines.append(
                "  - Modified: {}".format(
                    ", ".join("`{}`".format(p) for p in changes["files_modified"])
                )
            )
        if changes.get("files_added"):
            lines.append(
                "  - Added: {}".format(
                    ", ".join("`{}`".format(p) for p in changes["files_added"])
                )
            )
        if changes.get("files_deleted"):
            lines.append(
                "  - Deleted: {}".format(
                    ", ".join("`{}`".format(p) for p in changes["files_deleted"])
                )
            )
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
            for item in report["review"]:
                name = item["name"]
                date = item["date"]
                changes = item.get("file_changes", {})
                lines.append(f"- `{name}` (lastUpdated: {date})")
                if changes.get("skill_md_changed"):
                    lines.append("  - SKILL.md body changed")
                if changes.get("files_modified"):
                    lines.append(
                        "  - Modified: {} (local modifications detected)".format(
                            ", ".join(
                                "`{}`".format(p) for p in changes["files_modified"]
                            )
                        )
                    )
                if changes.get("files_added"):
                    lines.append(
                        "  - Added: {}".format(
                            ", ".join("`{}`".format(p) for p in changes["files_added"])
                        )
                    )
                if changes.get("files_deleted"):
                    lines.append(
                        "  - Deleted: {}".format(
                            ", ".join(
                                "`{}`".format(p) for p in changes["files_deleted"]
                            )
                        )
                    )
            lines.append("")

        # New upstream skills (with links)
        if report["new_skills"]:
            lines.append("**New Upstream Skills Detected:**")
            for item in report["new_skills"]:
                lines.append("- [`{}`]({})".format(item["dir"], item["url"]))
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
            for item in adapted_changed:
                name = item["name"]
                section_diff = item["section_diff"]
                history_url = item["url"]
                changes = item.get("file_changes", {})
                lines.append(
                    f"- `{name}` \u2014 {section_diff} ([history]({history_url}))"
                )
                if changes.get("skill_md_changed"):
                    lines.append("  - SKILL.md body changed")
                if changes.get("files_modified"):
                    lines.append(
                        "  - Modified: {}".format(
                            ", ".join(
                                "`{}`".format(p) for p in changes["files_modified"]
                            )
                        )
                    )
                if changes.get("files_added"):
                    lines.append(
                        "  - Added: {}".format(
                            ", ".join("`{}`".format(p) for p in changes["files_added"])
                        )
                    )
                if changes.get("files_deleted"):
                    lines.append(
                        "  - Deleted: {}".format(
                            ", ".join(
                                "`{}`".format(p) for p in changes["files_deleted"]
                            )
                        )
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
    for item in report["safe"]:
        name = item["name"]
        changes = item.get("file_changes", {})
        skill_root = f"catalog/skills/{name}"

        if changes.get("skill_md_changed"):
            git("add", f"{skill_root}/SKILL.md")

        for rel_path in changes.get("files_added", []):
            git("add", f"{skill_root}/{rel_path}")
        for rel_path in changes.get("files_modified", []):
            git("add", f"{skill_root}/{rel_path}")
        for rel_path in changes.get("files_deleted", []):
            git("rm", f"{skill_root}/{rel_path}", check=False)

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


def _print_file_diff(
    owner_repo: str,
    ref: str,
    upstream_path: str,
    local_path: Path,
    rel_path: str,
    provenance: str,
) -> None:
    """Print unified diff for one non-SKILL.md file."""
    upstream_raw = fetch_raw_file(owner_repo, ref, upstream_path)
    if upstream_raw is None:
        print(
            f"  Upstream not found for `{rel_path}`: {owner_repo}/{upstream_path} (404)"
        )
        return

    try:
        local_text = local_path.read_text()
    except UnicodeDecodeError:
        print(f"  Binary file (diff skipped): `{rel_path}`")
        return

    local_lines = local_text.splitlines(keepends=True)
    upstream_lines = upstream_raw.splitlines(keepends=True)
    diff = list(
        difflib.unified_diff(
            local_lines,
            upstream_lines,
            fromfile=f"{local_path} (local)",
            tofile=f"{upstream_path} ({owner_repo}@{ref})",
        )
    )
    if not diff:
        return

    print(f"  File diff: `{rel_path}`")
    for line in diff:
        print(line, end="")


def _print_skill_diff(
    owner_repo: str,
    ref: str,
    tree: dict[str, str],
    upstream_path: str,
    catalog_name: str,
    provenance: str,
    skill_file: str,
) -> None:
    """Fetch upstream and print unified diff for one skill."""
    header = f"=== {catalog_name} ({provenance}) \u2014 {owner_repo} ==="

    local_path = CATALOG_SKILLS / catalog_name / "SKILL.md"
    print(header)
    if not local_path.exists():
        print(f"  Local file not found: {local_path}")
        print()
        return

    local_raw = local_path.read_text()
    _, local_body = split_frontmatter(local_raw)

    upstream_raw = fetch_raw_file(owner_repo, ref, upstream_path)
    if upstream_raw is None:
        print(f"  Upstream not found: {owner_repo}/{upstream_path} (404)")
        print()
        return

    _, upstream_body = split_frontmatter(upstream_raw)
    if sha256(local_body) == sha256(upstream_body):
        print("  SKILL.md body unchanged")
    else:
        local_lines = local_body.splitlines(keepends=True)
        upstream_lines = upstream_body.splitlines(keepends=True)
        diff = difflib.unified_diff(
            local_lines,
            upstream_lines,
            fromfile=f"catalog/skills/{catalog_name}/SKILL.md (local body)",
            tofile=f"{upstream_path} ({owner_repo}@{ref})",
        )
        for line in diff:
            print(line, end="")

    prefix = upstream_path.rsplit("/", 1)[0] + "/"
    upstream_files = list_skill_files(tree, prefix)
    upstream_files.pop(skill_file, None)

    local_root = CATALOG_SKILLS / catalog_name
    for rel_path in sorted(upstream_files.keys()):
        local_file = local_root / rel_path
        upstream_file_path = prefix + rel_path
        if is_binary_file(rel_path):
            if not local_file.exists():
                print(f"  New upstream file: `{rel_path}` (binary)")
            else:
                print(f"  Binary file (diff skipped): `{rel_path}`")
            continue
        if not local_file.exists():
            print(f"  New upstream file: `{rel_path}`")
            continue
        _print_file_diff(
            owner_repo,
            ref,
            upstream_file_path,
            local_file,
            rel_path,
            provenance,
        )

    local_files: set[str] = set()
    if local_root.exists():
        for path in local_root.rglob("*"):
            if not path.is_file():
                continue
            rel_path = str(path.relative_to(local_root))
            if rel_path == "SKILL.md":
                continue
            if os.path.basename(rel_path) in LOCAL_ONLY_FILES:
                continue
            local_files.add(rel_path)

    for rel_path in sorted(local_files - set(upstream_files.keys())):
        print(f"  Deleted upstream: `{rel_path}`")

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
        tree = fetch_repo_tree(owner_repo, ref)

        # Process ported skills
        for catalog_name, skill_cfg in skills.items():
            if skill_filter and catalog_name != skill_filter:
                continue

            upstream_dir = skill_cfg.get("upstream_dir", catalog_name)
            root = discover.get("root", "")
            skill_file = discover.get("skill_file", "SKILL.md")
            upstream_path = f"{root}{upstream_dir}/{skill_file}"

            _print_skill_diff(
                owner_repo,
                ref,
                tree,
                upstream_path,
                catalog_name,
                "ported",
                skill_file,
            )
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

            _print_skill_diff(
                owner_repo,
                ref,
                tree,
                upstream_path,
                catalog_name,
                "adapted",
                skill_file,
            )
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
    all_items = []
    for repo_report in all_reports.values():
        all_items.extend(repo_report.get("safe", []))
        all_items.extend(repo_report.get("review", []))
        all_items.extend(repo_report.get("adapted_changed", []))
    total_skill_md_changed = sum(
        1 if item.get("file_changes", {}).get("skill_md_changed") else 0
        for item in all_items
    )
    total_files_added = sum(
        len(item.get("file_changes", {}).get("files_added", [])) for item in all_items
    )
    total_files_modified = sum(
        len(item.get("file_changes", {}).get("files_modified", []))
        for item in all_items
    )
    total_files_deleted = sum(
        len(item.get("file_changes", {}).get("files_deleted", [])) for item in all_items
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
        print(f"SKILL.md changed:  {total_skill_md_changed}")
        print(f"Files added:       {total_files_added}")
        print(f"Files modified:    {total_files_modified}")
        print(f"Files deleted:     {total_files_deleted}")

    if total_new > 0:
        print("\nNew upstream skills detected:")
        for repo, report in all_reports.items():
            for item in report.get("new_skills", []):
                print("  {}: {} -> {}".format(repo, item["dir"], item["url"]))

    print("::endgroup::")


if __name__ == "__main__":
    main()
