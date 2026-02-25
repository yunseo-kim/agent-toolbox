---
name: goplaces
description: >
  Query Google Places API (New) via the goplaces CLI. Text search, place
  details, resolve locations, and read reviews with human-friendly or JSON
  output.
license: Sustainable Use License 1.0

metadata:
  domain: research
  tags: "google-places, maps, location, search, cli"
  author: "cpojer <christoph.pojer@gmail.com>"
  lastUpdated: "12026-01-31"
  provenance: ported
---

# goplaces

Modern Google Places API (New) CLI. Human output by default, `--json` for scripts.

Install

- Homebrew: `brew install steipete/tap/goplaces`

Config

- `GOOGLE_PLACES_API_KEY` required.
- Optional: `GOOGLE_PLACES_BASE_URL` for testing/proxying.

Common commands

- Search: `goplaces search "coffee" --open-now --min-rating 4 --limit 5`
- Bias: `goplaces search "pizza" --lat 40.8 --lng -73.9 --radius-m 3000`
- Pagination: `goplaces search "pizza" --page-token "NEXT_PAGE_TOKEN"`
- Resolve: `goplaces resolve "Soho, London" --limit 5`
- Details: `goplaces details <place_id> --reviews`
- JSON: `goplaces search "sushi" --json`

Notes

- `--no-color` or `NO_COLOR` disables ANSI color.
- Price levels: 0..4 (free → very expensive).
- Type filter sends only the first `--type` value (API accepts one).
