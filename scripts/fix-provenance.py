#!/usr/bin/env python3
"""
Fix provenance classification for misclassified skills.
Updates SKILL.md frontmatter (provenance + author fields).
"""

import os
import re

CATALOG_DIR = "catalog/skills"
MODIFIER = '"Yunseo Kim <dev@yunseo.kim>"'

# 19 skills: ported → adapted (body content was modified from upstream)
PORTED_TO_ADAPTED = [
    "ai-sdk",  # Unicode → ASCII normalization
    "algorithmic-art",  # De-branding: Anthropic → generic
    "apple-reminders",  # De-branding: Clawdbot → generic
    "canvas-design",  # De-branding: Claude → generic
    "doc-coauthoring",  # De-branding: Claude → the assistant (20+ changes)
    "frontend-design",  # De-branding: Claude → generic
    "github-cli",  # De-branding: coding-agent → generic
    "loom-transcript",  # ASCII normalization: em dash → double hyphen
    "nano-banana-pro",  # Path normalization + de-branding
    "openai-image-gen",  # Path normalization: baseDir → skillDir
    "openai-whisper-api",  # Path normalization + de-branding
    "sag-tts",  # De-branding: Clawd → the assistant
    "sherpa-onnx-tts",  # Path normalization + de-branding
    "skill-creator",  # Major restructuring (-123 lines)
    "things-mac-cli",  # De-branding: OpenClaw → generic
    "tmux-controller",  # De-branding: Claude/Codex → AI assistant
    "trello-api",  # De-branding: OpenClaw → generic
    "video-frames",  # Path normalization: baseDir → skillDir
    "web-artifacts-builder",  # De-branding: claude.ai → generic
]

# 1 skill: adapted → ported (body matches upstream exactly)
ADAPTED_TO_PORTED = {
    "ai-elements": '"Hayden Bleasel <hello@haydenbleasel.com>"',  # upstream author
}


def update_frontmatter_field(content, field, new_value):
    """Update a specific field in YAML frontmatter."""
    lines = content.split("\n")
    in_frontmatter = False
    frontmatter_count = 0

    for i, line in enumerate(lines):
        if line.strip() == "---":
            frontmatter_count += 1
            if frontmatter_count == 1:
                in_frontmatter = True
                continue
            elif frontmatter_count == 2:
                break

        if in_frontmatter:
            # Match the field (handle both top-level and nested under metadata)
            match = re.match(rf"^(\s*){field}:\s*.+", line)
            if match:
                indent = match.group(1)
                lines[i] = f"{indent}{field}: {new_value}"
                return "\n".join(lines)

    return content  # Field not found, return unchanged


def main():
    changes = []

    # Phase 1: Reclassify ported → adapted
    print("=" * 80)
    print("PHASE 1: Reclassifying ported → adapted (19 skills)")
    print("=" * 80)

    for skill_name in PORTED_TO_ADAPTED:
        skill_path = os.path.join(CATALOG_DIR, skill_name, "SKILL.md")
        if not os.path.exists(skill_path):
            print(f"  ❌ {skill_name}: SKILL.md not found")
            continue

        with open(skill_path) as f:
            content = f.read()

        original = content

        # Update provenance
        content = update_frontmatter_field(content, "provenance", "adapted")

        # Update author to modifier
        content = update_frontmatter_field(content, "author", MODIFIER)

        if content != original:
            with open(skill_path, "w") as f:
                f.write(content)
            changes.append(f"  ✅ {skill_name}: ported → adapted, author → Yunseo Kim")
        else:
            changes.append(f"  ⚠️  {skill_name}: no changes needed")

    # Phase 2: Reclassify adapted → ported
    print("\n" + "=" * 80)
    print("PHASE 2: Reclassifying adapted → ported (1 skill)")
    print("=" * 80)

    for skill_name, upstream_author in ADAPTED_TO_PORTED.items():
        skill_path = os.path.join(CATALOG_DIR, skill_name, "SKILL.md")
        if not os.path.exists(skill_path):
            print(f"  ❌ {skill_name}: SKILL.md not found")
            continue

        with open(skill_path) as f:
            content = f.read()

        original = content

        # Update provenance
        content = update_frontmatter_field(content, "provenance", "ported")

        # Update author to upstream author
        content = update_frontmatter_field(content, "author", upstream_author)

        if content != original:
            with open(skill_path, "w") as f:
                f.write(content)
            changes.append(
                f"  ✅ {skill_name}: adapted → ported, author → {upstream_author}"
            )
        else:
            changes.append(f"  ⚠️  {skill_name}: no changes needed")

    # Report
    print("\n" + "=" * 80)
    print("CHANGES MADE")
    print("=" * 80)
    for change in changes:
        print(change)

    print(f"\nTotal: {len(changes)} skills updated")


if __name__ == "__main__":
    main()
