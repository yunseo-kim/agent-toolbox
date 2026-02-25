---
name: blucli
description: >
  Control Bluesound/NAD players via the BluOS CLI. Discovery, playback,
  grouping, and volume management from the terminal.
license: Sustainable Use License 1.0

metadata:
  domain: productivity
  tags: "bluos, audio, smart-speaker, iot, media-playback, cli"
  author: "cpojer <christoph.pojer@gmail.com>"
  lastUpdated: "12026-01-31"
  provenance: ported
---

# blucli (blu)

Use `blu` to control Bluesound/NAD players.

Quick start

- `blu devices` (pick target)
- `blu --device <id> status`
- `blu play|pause|stop`
- `blu volume set 15`

Target selection (in priority order)

- `--device <id|name|alias>`
- `BLU_DEVICE`
- config default (if set)

Common tasks

- Grouping: `blu group status|add|remove`
- TuneIn search/play: `blu tunein search "query"`, `blu tunein play "query"`

Prefer `--json` for scripts. Confirm the target device before changing playback.
