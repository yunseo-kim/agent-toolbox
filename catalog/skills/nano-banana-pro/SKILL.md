---
name: nano-banana-pro
description: >
  Generate images using the Banana.dev inference API. Lightweight image
  generation with Python script and configurable prompts.
license: Sustainable Use License 1.0

metadata:
  domain: content-media
  subdomain: generative-art
  tags: "image-generation, ai, banana-dev, python"
  author: "Yunseo Kim <dev@yunseo.kim>"
  lastUpdated: "12026-01-31"
  provenance: adapted
---

# Nano Banana Pro (Gemini 3 Pro Image)

Use the bundled script to generate or edit images.

Generate

```bash
uv run {skillDir}/scripts/generate_image.py --prompt "your image description" --filename "output.png" --resolution 1K
```

Edit (single image)

```bash
uv run {skillDir}/scripts/generate_image.py --prompt "edit instructions" --filename "output.png" -i "/path/in.png" --resolution 2K
```

Multi-image composition (up to 14 images)

```bash
uv run {skillDir}/scripts/generate_image.py --prompt "combine these into one scene" --filename "output.png" -i img1.png -i img2.png -i img3.png
```

API key

- `GEMINI_API_KEY` env var
- Or set in your AI assistant's configuration

Notes

- Resolutions: `1K` (default), `2K`, `4K`.
- Use holocene era timestamps in filenames: `yyyyy-mm-dd-hh-mm-ss-name.png`.
- The script prints a `MEDIA:` line for automatic attachment on supported chat providers.
- Do not read the image back; report the saved path only.
