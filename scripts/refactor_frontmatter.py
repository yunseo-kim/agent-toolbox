#!/usr/bin/env python3
"""Refactor SKILL.md frontmatter to agentskills.io spec compliance.

Moves top-level `domain`, `subdomain`, `tags`, `frameworks` fields
into a `metadata:` block with string values (arrays → comma-separated).

Usage:
    python3 scripts/refactor_frontmatter.py                # execute
    python3 scripts/refactor_frontmatter.py --dry-run      # preview only
"""

import glob
import os
import re
import sys


CATALOG_DIR = os.path.join(os.path.dirname(__file__), "..", "catalog", "skills")


def parse_array(value: str) -> str:
    """Convert YAML inline array '[a, b, c]' to comma-separated string 'a, b, c'."""
    value = value.strip()
    if value.startswith("[") and value.endswith("]"):
        inner = value[1:-1]
        items = [item.strip() for item in inner.split(",") if item.strip()]
        return ", ".join(items)
    return value


def transform_frontmatter(content: str) -> tuple[str, bool]:
    """Transform SKILL.md content. Returns (new_content, was_changed)."""
    # Split on the frontmatter delimiters
    # Pattern: starts with ---, frontmatter, ---, body
    match = re.match(r"^(---\n)(.*?)(---\n)(.*)", content, re.DOTALL)
    if not match:
        return content, False

    opening = match.group(1)  # "---\n"
    fm_text = match.group(2)  # frontmatter content
    closing = match.group(3)  # "---\n"
    body = match.group(4)  # everything after

    # Check if already transformed (has metadata: block)
    if re.search(r"^metadata:\s*$", fm_text, re.MULTILINE):
        return content, False

    # Extract the 4 non-spec fields
    domain_match = re.search(r"^domain:\s*(.+)$", fm_text, re.MULTILINE)
    subdomain_match = re.search(r"^subdomain:\s*(.+)$", fm_text, re.MULTILINE)
    tags_match = re.search(r"^tags:\s*(.+)$", fm_text, re.MULTILINE)
    frameworks_match = re.search(r"^frameworks:\s*(.+)$", fm_text, re.MULTILINE)

    if not domain_match:
        # No domain field — nothing to transform
        return content, False

    # Capture values
    domain_val = domain_match.group(1).strip()
    subdomain_val = subdomain_match.group(1).strip() if subdomain_match else None
    tags_val = parse_array(tags_match.group(1).strip()) if tags_match else None
    frameworks_val = (
        parse_array(frameworks_match.group(1).strip()) if frameworks_match else None
    )

    # Remove the old lines from frontmatter
    lines = fm_text.split("\n")
    new_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("domain:"):
            continue
        if stripped.startswith("subdomain:"):
            continue
        if stripped.startswith("tags:"):
            continue
        if stripped.startswith("frameworks:"):
            continue
        new_lines.append(line)

    # Remove trailing empty lines before we add metadata block
    while new_lines and new_lines[-1].strip() == "":
        new_lines.pop()

    # Build metadata block
    metadata_lines = ["metadata:"]
    metadata_lines.append(f"  domain: {domain_val}")
    if subdomain_val:
        metadata_lines.append(f"  subdomain: {subdomain_val}")
    if tags_val:
        metadata_lines.append(f'  tags: "{tags_val}"')
    if frameworks_val:
        metadata_lines.append(f'  frameworks: "{frameworks_val}"')

    # Reconstruct frontmatter
    new_lines.append("")  # blank line before metadata block
    new_lines.extend(metadata_lines)
    new_lines.append("")  # trailing newline before closing ---

    new_fm = "\n".join(new_lines)
    new_content = opening + new_fm + closing + body

    return new_content, True


def main():
    dry_run = "--dry-run" in sys.argv

    skill_dirs = sorted(glob.glob(os.path.join(CATALOG_DIR, "*", "SKILL.md")))
    print(f"Found {len(skill_dirs)} SKILL.md files")

    changed = 0
    skipped = 0
    errors = 0

    for filepath in skill_dirs:
        skill_name = os.path.basename(os.path.dirname(filepath))
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                original = f.read()

            new_content, was_changed = transform_frontmatter(original)

            if was_changed:
                if dry_run:
                    print(f"  [WOULD CHANGE] {skill_name}")
                else:
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    print(f"  [CHANGED] {skill_name}")
                changed += 1
            else:
                print(f"  [SKIP] {skill_name} (already compliant or no domain field)")
                skipped += 1

        except Exception as e:
            print(f"  [ERROR] {skill_name}: {e}")
            errors += 1

    print(f"\nSummary: {changed} changed, {skipped} skipped, {errors} errors")
    if dry_run:
        print("(Dry run — no files were modified)")


if __name__ == "__main__":
    main()
