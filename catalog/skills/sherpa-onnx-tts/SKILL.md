---
name: sherpa-onnx-tts
description: >
  Local text-to-speech via sherpa-onnx. Fully offline, no cloud dependency,
  supports multiple voice models across platforms.
license: Sustainable Use License 1.0

metadata:
  domain: content-media
  subdomain: media-processing
  tags: "tts, text-to-speech, local, offline, onnx"
  author: "Yunseo Kim <dev@yunseo.kim>"
  lastUpdated: "12026-02-16"
  provenance: adapted
---

# sherpa-onnx-tts

Local TTS using the sherpa-onnx offline CLI.

## Install

1. Download the runtime for your OS (extracts into `~/.the assistant/tools/sherpa-onnx-tts/runtime`)
2. Download a voice model (extracts into `~/.the assistant/tools/sherpa-onnx-tts/models`)

Update `~/.the assistant/the assistant.json`:

```json5
{
  skills: {
    entries: {
      "sherpa-onnx-tts": {
        env: {
          SHERPA_ONNX_RUNTIME_DIR: "~/.the assistant/tools/sherpa-onnx-tts/runtime",
          SHERPA_ONNX_MODEL_DIR: "~/.the assistant/tools/sherpa-onnx-tts/models/vits-piper-en_US-lessac-high",
        },
      },
    },
  },
}
```

The wrapper lives in this skill folder. Run it directly, or add the wrapper to PATH:

```bash
export PATH="{skillDir}/bin:$PATH"
```

## Usage

```bash
{skillDir}/bin/sherpa-onnx-tts -o ./tts.wav "Hello from local TTS."
```

Notes:

- Pick a different model from the sherpa-onnx `tts-models` release if you want another voice.
- If the model dir has multiple `.onnx` files, set `SHERPA_ONNX_MODEL_FILE` or pass `--model-file`.
- You can also pass `--tokens-file` or `--data-dir` to override the defaults.
- Windows: run `node {skillDir}\\bin\\sherpa-onnx-tts -o tts.wav "Hello from local TTS."`
