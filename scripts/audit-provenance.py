#!/usr/bin/env python3
"""
Audit provenance classification of all catalog skills.
Compares ported/adapted skills' body content against upstream SKILL.md.
"""

import os
import re
import subprocess
import sys
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError
import time

CATALOG_DIR = "catalog/skills"
UPSTREAM_FILE = "catalog/metadata/upstream-sources.yaml"


def parse_upstream_sources(filepath):
    """Parse upstream-sources.yaml manually (no pyyaml dependency)."""
    with open(filepath) as f:
        content = f.read()

    sources = {}
    current_repo = None
    current_section = None  # 'skills' or 'adapted_skills'
    ref = None
    root = None
    skill_file = None

    for line in content.split("\n"):
        stripped = line.strip()
        # Remove inline comments (but be careful with URLs)
        if "#" in stripped and not stripped.startswith("#"):
            # Don't strip # from URLs
            if "http" not in stripped.split("#")[0]:
                stripped = stripped.split("#")[0].strip()

        # Source repo
        repo_match = re.match(r"^  (\S+/\S+):$", line)
        if repo_match:
            current_repo = repo_match.group(1).rstrip(":")
            sources[current_repo] = {
                "ref": "",
                "root": "",
                "skill_file": "SKILL.md",
                "skills": {},
                "adapted_skills": {},
            }
            current_section = None
            continue

        if current_repo is None:
            continue

        # ref
        ref_match = re.match(r"^\s+ref:\s+(\S+)", line)
        if ref_match:
            sources[current_repo]["ref"] = ref_match.group(1)
            continue

        # discover.root
        root_match = re.match(r"^\s+root:\s+(\S+)", line)
        if root_match:
            sources[current_repo]["root"] = root_match.group(1)
            continue

        # discover.skill_file
        sf_match = re.match(r"^\s+skill_file:\s+(\S+)", line)
        if sf_match:
            sources[current_repo]["skill_file"] = sf_match.group(1)
            continue

        # Section headers
        if re.match(r"^\s+skills:$", line):
            current_section = "skills"
            continue
        if re.match(r"^\s+adapted_skills:$", line):
            current_section = "adapted_skills"
            continue
        if re.match(r"^\s+adapted_skills:\s*\{\}", line):
            current_section = None
            continue
        if re.match(r"^\s+skills:\s*\{\}", line):
            current_section = None
            continue
        if re.match(r"^\s+ignored:", line):
            current_section = None
            continue

        # Skill entries
        if current_section in ("skills", "adapted_skills"):
            # Match: skill-name: { upstream_dir: dir-name }
            skill_match = re.match(
                r"^\s+(\S+):\s+\{\s*upstream_dir:\s+(\S+)\s*\}", line
            )
            if skill_match:
                name = skill_match.group(1).rstrip(":")
                upstream_dir = skill_match.group(2)
                sources[current_repo][current_section][name] = {
                    "upstream_dir": upstream_dir
                }
                continue

            # Match: skill-name: { upstream_path: path/to/file }
            path_match = re.match(
                r"^\s+(\S+):\s+\{\s*upstream_path:\s+(\S+)\s*\}", line
            )
            if path_match:
                name = path_match.group(1).rstrip(":")
                upstream_path = path_match.group(2)
                sources[current_repo][current_section][name] = {
                    "upstream_path": upstream_path
                }
                continue

    return sources


def strip_frontmatter(text):
    """Remove YAML frontmatter (between --- delimiters) from SKILL.md content."""
    lines = text.split("\n")
    in_frontmatter = False
    frontmatter_end = 0
    for i, line in enumerate(lines):
        if line.strip() == "---":
            if not in_frontmatter:
                in_frontmatter = True
            else:
                frontmatter_end = i + 1
                break
    return "\n".join(lines[frontmatter_end:]).strip()


def get_frontmatter_field(text, field):
    """Extract a field from YAML frontmatter."""
    lines = text.split("\n")
    in_frontmatter = False
    for line in lines:
        if line.strip() == "---":
            if not in_frontmatter:
                in_frontmatter = True
                continue
            else:
                break
        if in_frontmatter:
            match = re.match(rf"^\s*{field}:\s*(.+)", line)
            if match:
                return match.group(1).strip().strip('"').strip("'")
    return None


def fetch_upstream_content(repo, ref, path, retries=2):
    """Fetch raw file content from GitHub via raw.githubusercontent.com."""
    url = f"https://raw.githubusercontent.com/{repo}/{ref}/{path}"
    for attempt in range(retries + 1):
        try:
            req = Request(url, headers={"User-Agent": "provenance-audit"})
            with urlopen(req, timeout=15) as resp:
                return resp.read().decode("utf-8")
        except HTTPError as e:
            if e.code == 404:
                return None
            if attempt < retries:
                time.sleep(1)
                continue
            return f"HTTP_ERROR_{e.code}"
        except (URLError, Exception) as e:
            if attempt < retries:
                time.sleep(1)
                continue
            return f"FETCH_ERROR: {str(e)[:80]}"


def normalize_whitespace(text):
    """Normalize whitespace for comparison."""
    # Normalize line endings
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Strip trailing whitespace on each line
    lines = [line.rstrip() for line in text.split("\n")]
    # Remove trailing blank lines
    while lines and not lines[-1]:
        lines.pop()
    return "\n".join(lines)


def main():
    print("=" * 100)
    print("PROVENANCE CLASSIFICATION AUDIT")
    print("=" * 100)

    sources = parse_upstream_sources(UPSTREAM_FILE)

    # Build the complete mapping
    ported_skills = {}  # catalog_name -> (repo, upstream_path)
    adapted_skills = {}

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

        for name, skill_config in config.get("adapted_skills", {}).items():
            if "upstream_path" in skill_config:
                upstream_path = skill_config["upstream_path"]
            else:
                upstream_dir = skill_config["upstream_dir"]
                upstream_path = f"{root}{upstream_dir}/{skill_file}"
            adapted_skills[name] = (repo, ref, upstream_path)

    # Scan all catalog skills
    all_skills = sorted(os.listdir(CATALOG_DIR))
    all_skills = [s for s in all_skills if os.path.isdir(os.path.join(CATALOG_DIR, s))]

    print(f"\nTotal catalog skills: {len(all_skills)}")
    print(f"Ported skills in upstream-sources.yaml: {len(ported_skills)}")
    print(f"Adapted skills in upstream-sources.yaml: {len(adapted_skills)}")

    # Phase 1: Check frontmatter provenance vs upstream-sources.yaml consistency
    print(f"\n{'=' * 100}")
    print("PHASE 1: Frontmatter provenance vs upstream-sources.yaml consistency")
    print("=" * 100)

    phase1_issues = []
    skill_provenances = {}

    for skill_name in all_skills:
        skill_path = os.path.join(CATALOG_DIR, skill_name, "SKILL.md")
        if not os.path.exists(skill_path):
            phase1_issues.append((skill_name, "MISSING_SKILL_MD", ""))
            continue

        with open(skill_path) as f:
            content = f.read()

        provenance = get_frontmatter_field(content, "provenance")
        skill_provenances[skill_name] = provenance

        in_ported = skill_name in ported_skills
        in_adapted = skill_name in adapted_skills

        if provenance == "ported" and not in_ported:
            phase1_issues.append(
                (
                    skill_name,
                    "PORTED_NOT_IN_YAML_SKILLS",
                    f"provenance=ported but not in any skills section",
                )
            )
        elif provenance == "ported" and in_adapted:
            phase1_issues.append(
                (
                    skill_name,
                    "PORTED_IN_ADAPTED_SECTION",
                    f"provenance=ported but in adapted_skills section",
                )
            )
        elif provenance == "adapted" and in_ported:
            phase1_issues.append(
                (
                    skill_name,
                    "ADAPTED_IN_PORTED_SECTION",
                    f"provenance=adapted but in skills section",
                )
            )
        elif provenance == "adapted" and not in_adapted:
            phase1_issues.append(
                (
                    skill_name,
                    "ADAPTED_NOT_IN_YAML",
                    f"provenance=adapted but not in any adapted_skills section",
                )
            )
        elif provenance == "synthesized" and (in_ported or in_adapted):
            phase1_issues.append(
                (
                    skill_name,
                    "SYNTHESIZED_IN_YAML",
                    f"provenance=synthesized but found in upstream-sources.yaml",
                )
            )
        elif provenance == "original" and (in_ported or in_adapted):
            phase1_issues.append(
                (
                    skill_name,
                    "ORIGINAL_IN_YAML",
                    f"provenance=original but found in upstream-sources.yaml",
                )
            )

    if phase1_issues:
        print(f"\n❌ ISSUES FOUND ({len(phase1_issues)}):")
        for name, issue, detail in sorted(phase1_issues):
            print(f"  {name:35s} | {issue:30s} | {detail}")
    else:
        print(
            "\n✅ All frontmatter provenance values are consistent with upstream-sources.yaml"
        )

    # Phase 2: Compare ported skills body content against upstream
    print(f"\n{'=' * 100}")
    print("PHASE 2: Comparing ported skills body content against upstream")
    print("=" * 100)

    phase2_issues = []
    ported_count = 0
    match_count = 0

    for skill_name in sorted(ported_skills.keys()):
        repo, ref, upstream_path = ported_skills[skill_name]
        local_path = os.path.join(CATALOG_DIR, skill_name, "SKILL.md")

        if not os.path.exists(local_path):
            phase2_issues.append((skill_name, repo, "MISSING_LOCAL", ""))
            continue

        ported_count += 1

        # Read local
        with open(local_path) as f:
            local_content = f.read()
        local_body = normalize_whitespace(strip_frontmatter(local_content))

        # Fetch upstream
        upstream_content = fetch_upstream_content(repo, ref, upstream_path)
        if upstream_content is None:
            phase2_issues.append((skill_name, repo, "UPSTREAM_404", upstream_path))
            continue
        if isinstance(upstream_content, str) and upstream_content.startswith(
            ("HTTP_ERROR", "FETCH_ERROR")
        ):
            phase2_issues.append((skill_name, repo, upstream_content, upstream_path))
            continue

        upstream_body = normalize_whitespace(strip_frontmatter(upstream_content))

        if local_body == upstream_body:
            match_count += 1
        else:
            # Calculate difference
            local_lines = local_body.split("\n")
            upstream_lines = upstream_body.split("\n")

            # Find first differing line
            first_diff = -1
            for i in range(min(len(local_lines), len(upstream_lines))):
                if local_lines[i] != upstream_lines[i]:
                    first_diff = i + 1
                    break
            if first_diff == -1:
                first_diff = min(len(local_lines), len(upstream_lines)) + 1

            delta = len(local_lines) - len(upstream_lines)
            phase2_issues.append(
                (
                    skill_name,
                    repo,
                    "BODY_DIFFERS",
                    f"upstream={len(upstream_lines)}L local={len(local_lines)}L delta={delta:+d} first_diff=L{first_diff}",
                )
            )

        # Rate limiting
        time.sleep(0.1)

        # Progress
        if ported_count % 10 == 0:
            print(f"  ... checked {ported_count} ported skills", file=sys.stderr)

    print(
        f"\nChecked {ported_count} ported skills: {match_count} match, {len(phase2_issues)} issues"
    )
    if phase2_issues:
        print(f"\n❌ PORTED SKILLS WITH BODY DIFFERENCES:")
        for name, repo, status, detail in sorted(phase2_issues):
            print(f"  {name:35s} | {repo:35s} | {status:15s} | {detail}")
    else:
        print("\n✅ All ported skills match their upstream body content")

    # Phase 3: Compare adapted skills to confirm they have body modifications
    print(f"\n{'=' * 100}")
    print("PHASE 3: Verifying adapted skills have body modifications")
    print("=" * 100)

    phase3_issues = []
    adapted_count = 0

    for skill_name in sorted(adapted_skills.keys()):
        repo, ref, upstream_path = adapted_skills[skill_name]
        local_path = os.path.join(CATALOG_DIR, skill_name, "SKILL.md")

        if not os.path.exists(local_path):
            phase3_issues.append((skill_name, repo, "MISSING_LOCAL", ""))
            continue

        adapted_count += 1

        with open(local_path) as f:
            local_content = f.read()
        local_body = normalize_whitespace(strip_frontmatter(local_content))

        upstream_content = fetch_upstream_content(repo, ref, upstream_path)
        if upstream_content is None:
            phase3_issues.append((skill_name, repo, "UPSTREAM_404", upstream_path))
            continue
        if isinstance(upstream_content, str) and upstream_content.startswith(
            ("HTTP_ERROR", "FETCH_ERROR")
        ):
            phase3_issues.append((skill_name, repo, upstream_content, upstream_path))
            continue

        upstream_body = normalize_whitespace(strip_frontmatter(upstream_content))

        if local_body == upstream_body:
            phase3_issues.append(
                (
                    skill_name,
                    repo,
                    "NO_BODY_CHANGES",
                    "Classified as 'adapted' but body content matches upstream — should be 'ported'",
                )
            )

        time.sleep(0.1)

    print(f"\nChecked {adapted_count} adapted skills")
    if phase3_issues:
        print(f"\n❌ ADAPTED SKILLS WITHOUT BODY CHANGES (should be 'ported'):")
        for name, repo, status, detail in sorted(phase3_issues):
            print(f"  {name:35s} | {repo:35s} | {status:15s} | {detail}")
    else:
        print(
            "\n✅ All adapted skills have body modifications confirming adapted status"
        )

    # Phase 4: Check synthesized skills source count
    print(f"\n{'=' * 100}")
    print("PHASE 4: Checking synthesized skills source count")
    print("=" * 100)

    for skill_name in all_skills:
        prov = skill_provenances.get(skill_name)
        if prov == "synthesized":
            notice_path = os.path.join(CATALOG_DIR, skill_name, "NOTICE.md")
            if os.path.exists(notice_path):
                with open(notice_path) as f:
                    notice = f.read()
                # Count source sections (## repo/name or ## Source lines)
                source_sections = re.findall(r"^##\s+\S+/\S+", notice, re.MULTILINE)
                source_urls = re.findall(
                    r"Source:\s+<https://github\.com/([^>]+)>", notice
                )
                unique_repos = set()
                for url in source_urls:
                    # Extract org/repo
                    parts = url.strip("/").split("/")
                    if len(parts) >= 2:
                        unique_repos.add(f"{parts[0]}/{parts[1]}")

                if len(unique_repos) < 2:
                    print(
                        f"  ⚠️  {skill_name:35s} | synthesized but only {len(unique_repos)} source repo(s): {unique_repos or 'none found'}"
                    )
                else:
                    print(
                        f"  ✅ {skill_name:35s} | {len(unique_repos)} source repos: {unique_repos}"
                    )
            else:
                print(f"  ❌ {skill_name:35s} | MISSING NOTICE.md")

    print(f"\n{'=' * 100}")
    print("AUDIT COMPLETE")
    print("=" * 100)


if __name__ == "__main__":
    main()
