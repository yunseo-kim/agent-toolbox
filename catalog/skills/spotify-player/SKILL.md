---
name: spotify-player
description: >
  Terminal Spotify playback and search via spogo (preferred) or
  spotify_player CLI. Search tracks, control playback, manage devices, and
  browse playlists.
license: Sustainable Use License 1.0

metadata:
  domain: content-media
  subdomain: media-processing
  tags: "spotify, music, playback, search, cli"
  author: "cpojer <christoph.pojer@gmail.com>"
  lastUpdated: "12026-01-31"
  provenance: ported
---

# spogo / spotify_player

Use `spogo` **(preferred)** for Spotify playback/search. Fall back to `spotify_player` if needed.

Requirements

- Spotify Premium account.
- Either `spogo` or `spotify_player` installed.

spogo setup

- Import cookies: `spogo auth import --browser chrome`

Common CLI commands

- Search: `spogo search track "query"`
- Playback: `spogo play|pause|next|prev`
- Devices: `spogo device list`, `spogo device set "<name|id>"`
- Status: `spogo status`

spotify_player commands (fallback)

- Search: `spotify_player search "query"`
- Playback: `spotify_player playback play|pause|next|previous`
- Connect device: `spotify_player connect`
- Like track: `spotify_player like`

Notes

- Config folder: `~/.config/spotify-player` (e.g., `app.toml`).
- For Spotify Connect integration, set a user `client_id` in config.
- TUI shortcuts are available via `?` in the app.
