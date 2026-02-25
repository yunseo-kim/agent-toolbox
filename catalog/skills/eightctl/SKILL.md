---
name: eightctl
description: >
  Control Eight Sleep pods via CLI. Check status, set temperature, manage
  alarms, and configure sleep schedules.
license: Sustainable Use License 1.0

metadata:
  domain: productivity
  tags: "eight-sleep, iot, smart-home, sleep, cli"
  author: "cpojer <christoph.pojer@gmail.com>"
  lastUpdated: "12026-01-31"
  provenance: ported
---

# eightctl

Use `eightctl` for Eight Sleep pod control. Requires auth.

Auth

- Config: `~/.config/eightctl/config.yaml`
- Env: `EIGHTCTL_EMAIL`, `EIGHTCTL_PASSWORD`

Quick start

- `eightctl status`
- `eightctl on|off`
- `eightctl temp 20`

Common tasks

- Alarms: `eightctl alarm list|create|dismiss`
- Schedules: `eightctl schedule list|create|update`
- Audio: `eightctl audio state|play|pause`
- Base: `eightctl base info|angle`

Notes

- API is unofficial and rate-limited; avoid repeated logins.
- Confirm before changing temperature or alarms.
