# Marketing Tools Registry (Analytics-Tracking Local Bundle)

Local subset bundled from upstream `coreyhaines31/marketingskills/tools/REGISTRY.md`.
This file is intentionally scoped to analytics integrations referenced by this skill.

## Tool Index

| Tool | Category | API | MCP | CLI | SDK | Guide |
|------|----------|:---:|:---:|:---:|:---:|-------|
| ga4 | Analytics | ✓ | ✓ | [✓](clis/ga4.js) | ✓ | [ga4.md](integrations/ga4.md) |
| mixpanel | Analytics | ✓ | - | [✓](clis/mixpanel.js) | ✓ | [mixpanel.md](integrations/mixpanel.md) |
| amplitude | Analytics | ✓ | - | [✓](clis/amplitude.js) | ✓ | [amplitude.md](integrations/amplitude.md) |
| posthog | Analytics | ✓ | - | ✓ | ✓ | [posthog.md](integrations/posthog.md) |
| segment | Analytics | ✓ | - | [✓](clis/segment.js) | ✓ | [segment.md](integrations/segment.md) |

## Analytics

| Tool | Best For | MCP Available |
|------|----------|:-------------:|
| **ga4** | Web analytics, Google ecosystem | ✓ |
| **mixpanel** | Product analytics, event tracking | - |
| **amplitude** | Product analytics, cohort analysis | - |
| **posthog** | Open-source analytics, session replay | - |
| **segment** | Customer data platform, routing | - |

## Quick Start (Analytics Tracking)

1. Read [ga4.md](integrations/ga4.md) for GA4 setup and measurement planning.
2. Read [mixpanel.md](integrations/mixpanel.md) for product analytics event instrumentation.
3. Read [amplitude.md](integrations/amplitude.md) for behavioral analytics and cohorts.
4. Read [posthog.md](integrations/posthog.md) for self-hosted analytics and session replay.
5. Read [segment.md](integrations/segment.md) for event routing and destination sync.

## Security Notes

- Never store credentials in skill files, chat transcripts, or logs.
- Before any tracking-account write/change action, ask for explicit user approval.
- Bundled CLI scripts are local references for implementation support. Use them for tracking-account write/change actions only after user approval, with least-privilege credentials.
