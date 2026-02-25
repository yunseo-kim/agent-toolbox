---
name: openai-whisper-local
description: >
  Local speech-to-text transcription with the Whisper CLI. No API key
  required -- runs entirely offline with configurable model sizes.
license: Sustainable Use License 1.0

metadata:
  domain: content-media
  subdomain: media-processing
  tags: "whisper, transcription, speech-to-text, local, offline"
  author: "cpojer <christoph.pojer@gmail.com>"
  lastUpdated: "12026-01-31"
  provenance: ported
---

# Whisper (CLI)

Use `whisper` to transcribe audio locally.

Quick start

- `whisper /path/audio.mp3 --model medium --output_format txt --output_dir .`
- `whisper /path/audio.m4a --task translate --output_format srt`

Notes

- Models download to `~/.cache/whisper` on first run.
- `--model` defaults to `turbo` on this install.
- Use smaller models for speed, larger for accuracy.
