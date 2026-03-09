# Marketing Tools Registry (Paid-Ads Local Bundle)

Local subset bundled from upstream `coreyhaines31/marketingskills/tools/REGISTRY.md`.
This file is intentionally scoped to paid-ads and tracking integrations referenced by this skill.

## Tool Index

| Tool | Category | API | MCP | CLI | SDK | Guide |
|------|----------|:---:|:---:|:---:|:---:|-------|
| google-ads | Ads | ✓ | ✓ | [✓](clis/google-ads.js) | ✓ | [google-ads.md](integrations/google-ads.md) |
| meta-ads | Ads | ✓ | - | [✓](clis/meta-ads.js) | ✓ | [meta-ads.md](integrations/meta-ads.md) |
| linkedin-ads | Ads | ✓ | - | [✓](clis/linkedin-ads.js) | - | [linkedin-ads.md](integrations/linkedin-ads.md) |
| tiktok-ads | Ads | ✓ | - | [✓](clis/tiktok-ads.js) | ✓ | [tiktok-ads.md](integrations/tiktok-ads.md) |
| ga4 | Analytics | ✓ | ✓ | [✓](clis/ga4.js) | ✓ | [ga4.md](integrations/ga4.md) |
| segment | Analytics | ✓ | - | [✓](clis/segment.js) | ✓ | [segment.md](integrations/segment.md) |

## Advertising

| Tool | Best For | MCP Available |
|------|----------|:-------------:|
| **google-ads** | Search intent, high-intent traffic | ✓ |
| **meta-ads** | Demand gen, visual products, B2C | - |
| **linkedin-ads** | B2B, job title targeting | - |
| **tiktok-ads** | Younger demographics, video | - |

## Analytics

| Tool | Best For | MCP Available |
|------|----------|:-------------:|
| **ga4** | Web analytics, Google ecosystem | ✓ |
| **segment** | Customer data platform, routing | - |

## Quick Start (Paid Ads)

1. Read [google-ads.md](integrations/google-ads.md) for search campaigns.
2. Read [meta-ads.md](integrations/meta-ads.md) for social campaigns.
3. Read [linkedin-ads.md](integrations/linkedin-ads.md) for B2B targeting.
4. Read [tiktok-ads.md](integrations/tiktok-ads.md) for short-form video acquisition.
5. Read [ga4.md](integrations/ga4.md) and [segment.md](integrations/segment.md) for attribution/tracking setup.

## Security Notes

- Never store credentials in skill files, chat transcripts, or logs.
- Before any ad-account write/change action, ask for explicit user approval.
- Bundled CLI scripts are local references for implementation support. Use them for ad-account write/change actions only after user approval, with least-privilege credentials.
