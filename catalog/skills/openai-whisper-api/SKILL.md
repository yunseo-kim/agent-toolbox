---
name: openai-whisper-api
description: >
  Transcribe audio files via OpenAI Audio Transcriptions API (Whisper).
  Supports multiple formats with language detection and custom prompts.

metadata:
  domain: content-media
  subdomain: media-processing
  tags: "openai, whisper, transcription, speech-to-text, api"
---

# OpenAI Whisper API (curl)

Transcribe an audio file via OpenAI’s `/v1/audio/transcriptions` endpoint.

## Quick start

```bash
{skillDir}/scripts/transcribe.sh /path/to/audio.m4a
```

Defaults:

- Model: `whisper-1`
- Output: `<input>.txt`

## Useful flags

```bash
{skillDir}/scripts/transcribe.sh /path/to/audio.ogg --model whisper-1 --out /tmp/transcript.txt
{skillDir}/scripts/transcribe.sh /path/to/audio.m4a --language en
{skillDir}/scripts/transcribe.sh /path/to/audio.m4a --prompt "Speaker names: Peter, Daniel"
{skillDir}/scripts/transcribe.sh /path/to/audio.m4a --json --out /tmp/transcript.json
```

## API key

Set `OPENAI_API_KEY`, or configure it in `~/.the assistant/the assistant.json`:

```json5
{
  skills: {
    "openai-whisper-api": {
      apiKey: "OPENAI_KEY_HERE",
    },
  },
}
```
