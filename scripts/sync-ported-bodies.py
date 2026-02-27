#!/usr/bin/env python3
"""
Sync ported skill bodies to upstream.
Preserves local frontmatter, replaces body with upstream body.
Only modifies files where the body actually differs.
"""

import os
import re
import sys
import time
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError

CATALOG_DIR = "catalog/skills"
UPSTREAM_FILE = "catalog/metadata/upstream-sources.yaml"
DRY_RUN = "--dry-run" in sys.argv


def parse_upstream_sources(filepath):
    """Parse upstream-sources.yaml manually (no pyyaml dependency)."""
    with open(filepath) as f:
        content = f.read()

    sources = {}
    current_repo = None
    current_section = None

    for line in content.split("\n"):
        repo_match = re.match(r"^  (\S+/\S+):$", line)
        if repo_match:
            current_repo = repo_match.group(1).rstrip(":")
            sources[current_repo] = {
                "ref": "",
                "root": "",
                "skill_file": "SKILL.md",
                "skills": {},
            }
            current_section = None
            continue

        if current_repo is None:
            continue

        ref_match = re.match(r"^\s+ref:\s+(\S+)", line)
        if ref_match:
            sources[current_repo]["ref"] = ref_match.group(1)
            continue

        root_match = re.match(r"^\s+root:\s+(\S+)", line)
        if root_match:
            sources[current_repo]["root"] = root_match.group(1)
            continue

        sf_match = re.match(r"^\s+skill_file:\s+(\S+)", line)
        if sf_match:
            sources[current_repo]["skill_file"] = sf_match.group(1)
            continue

        if re.match(r"^\s+skills:$", line):
            current_section = "skills"
            continue
        if re.match(r"^\s+skills:\s*\{\}", line):
            current_section = None
            continue
        if re.match(r"^\s+adapted_skills:", line):
            current_section = None
            continue
        if re.match(r"^\s+ignored:", line):
            current_section = None
            continue

        if current_section == "skills":
            skill_match = re.match(
                r"^\s+(\S+):\s+\{\s*upstream_dir:\s+(\S+)\s*\}", line
            )
            if skill_match:
                name = skill_match.group(1).rstrip(":")
                upstream_dir = skill_match.group(2)
                sources[current_repo]["skills"][name] = {"upstream_dir": upstream_dir}
                continue

            path_match = re.match(
                r"^\s+(\S+):\s+\{\s*upstream_path:\s+(\S+)\s*\}", line
            )
            if path_match:
                name = path_match.group(1).rstrip(":")
                upstream_path = path_match.group(2)
                sources[current_repo]["skills"][name] = {"upstream_path": upstream_path}
                continue

    return sources


def extract_frontmatter(text):
    """Extract frontmatter string (including --- delimiters) and body separately."""
    lines = text.split("\n")
    if not lines or lines[0].strip() != "---":
        return "", text
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            frontmatter = "\n".join(lines[: i + 1])
            body = "\n".join(lines[i + 1 :])
            return frontmatter, body
    return "", text


def strip_frontmatter(text):
    """Remove frontmatter, strip leading/trailing whitespace."""
    _, body = extract_frontmatter(text)
    return body.strip()


def normalize_whitespace(text):
    """Normalize for comparison (same as audit-provenance.py)."""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = [line.rstrip() for line in text.split("\n")]
    while lines and not lines[-1]:
        lines.pop()
    return "\n".join(lines)


def fetch(repo, ref, path, retries=2):
    """Fetch raw file from GitHub."""
    url = f"https://raw.githubusercontent.com/{repo}/{ref}/{path}"
    for attempt in range(retries + 1):
        try:
            req = Request(url, headers={"User-Agent": "skill-sync"})
            with urlopen(req, timeout=15) as resp:
                return resp.read().decode("utf-8")
        except HTTPError as e:
            if e.code == 404:
                return None
            if attempt < retries:
                time.sleep(1)
                continue
            return None
        except (URLError, Exception):
            if attempt < retries:
                time.sleep(1)
                continue
            return None


def main():
    mode = "DRY RUN" if DRY_RUN else "LIVE"
    print(f"{'=' * 100}")
    print(f"SYNC PORTED SKILL BODIES TO UPSTREAM ({mode})")
    print(f"{'=' * 100}")

    sources = parse_upstream_sources(UPSTREAM_FILE)

    # Build ported skills map
    ported_skills = {}
    for repo, config in sources.items():
        ref = config["ref"]
        root = config["root"]
        skill_file = config["skill_file"]
        for name, skill_config in config.get("skills", {}).items():
            if "upstream_path" in skill_config:
                upstream_path = skill_config["upstream_path"]
            else:
                upstream_dir = skill_config["upstream_dir"]
                upstream_path = f"{root}{upstream_dir}/{skill_file}"
            ported_skills[name] = (repo, ref, upstream_path)

    print(f"\nTotal ported skills: {len(ported_skills)}")

    fixed = 0
    skipped = 0
    errors = 0
    already_match = 0

    for name in sorted(ported_skills.keys()):
        repo, ref, upstream_path = ported_skills[name]
        local_path = os.path.join(CATALOG_DIR, name, "SKILL.md")

        if not os.path.exists(local_path):
            print(f"  ❌ {name}: LOCAL FILE MISSING")
            errors += 1
            continue

        with open(local_path) as f:
            local_content = f.read()

        upstream_content = fetch(repo, ref, upstream_path)
        if upstream_content is None:
            print(f"  ❌ {name}: FETCH FAILED ({repo})")
            errors += 1
            continue

        # Compare normalized bodies
        local_body_norm = normalize_whitespace(strip_frontmatter(local_content))
        upstream_body_norm = normalize_whitespace(strip_frontmatter(upstream_content))

        if local_body_norm == upstream_body_norm:
            already_match += 1
            continue

        # Extract local frontmatter (preserve our metadata)
        local_fm, _ = extract_frontmatter(local_content)

        # Extract upstream body (raw, after frontmatter)
        _, upstream_body_raw = extract_frontmatter(upstream_content)

        # Normalize line endings in upstream body
        upstream_body_raw = upstream_body_raw.replace("\r\n", "\n").replace("\r", "\n")

        # Strip trailing whitespace from each line of upstream body
        upstream_body_lines = upstream_body_raw.split("\n")
        upstream_body_lines = [line.rstrip() for line in upstream_body_lines]
        upstream_body_clean = "\n".join(upstream_body_lines)

        # Remove leading blank lines from body (frontmatter already has newline after ---)
        # Keep one blank line between frontmatter and body content
        upstream_body_stripped = upstream_body_clean.lstrip("\n")

        # Reconstruct: frontmatter + newline + body + trailing newline
        new_content = local_fm + "\n" + upstream_body_stripped
        if not new_content.endswith("\n"):
            new_content += "\n"

        if DRY_RUN:
            print(f"  🔄 {name}: WOULD SYNC ({repo})")
            fixed += 1
        else:
            with open(local_path, "w") as f:
                f.write(new_content)
            print(f"  ✅ {name}: SYNCED ({repo})")
            fixed += 1

        time.sleep(0.1)

    print(f"\n{'=' * 100}")
    print(f"RESULTS ({mode})")
    print(f"{'=' * 100}")
    print(f"  Already matching: {already_match}")
    print(f"  Fixed:            {fixed}")
    print(f"  Errors:           {errors}")
    print(f"  Total ported:     {len(ported_skills)}")

    if errors > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
