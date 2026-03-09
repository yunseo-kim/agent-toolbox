# Marketing Tools Registry (Referral-Program Local Bundle)

Local subset bundled from upstream `coreyhaines31/marketingskills/tools/REGISTRY.md`.
This file is intentionally scoped to referral-program and payments integrations referenced by this skill.

## Tool Index

| Tool | Category | API | MCP | CLI | SDK | Guide |
|------|----------|:---:|:---:|:---:|:---:|-------|
| rewardful | Referral | ✓ | - | [✓](clis/rewardful.js) | - | [rewardful.md](integrations/rewardful.md) |
| tolt | Referral | ✓ | - | [✓](clis/tolt.js) | - | [tolt.md](integrations/tolt.md) |
| mention-me | Referral | ✓ | - | [✓](clis/mention-me.js) | - | [mention-me.md](integrations/mention-me.md) |
| dub-co | Links | ✓ | - | [✓](clis/dub.js) | ✓ | [dub-co.md](integrations/dub-co.md) |
| stripe | Payments | ✓ | ✓ | ✓ | ✓ | [stripe.md](integrations/stripe.md) |

## Referral & Affiliate

| Tool | Best For | Stripe Integration |
|------|----------|:------------------:|
| **rewardful** | Stripe-native affiliate programs | ✓ |
| **tolt** | SaaS affiliate programs | ✓ |
| **mention-me** | Enterprise referral programs | ✓ |
| **dub-co** | Link tracking and attribution | - |

## Payments

| Tool | Best For | MCP Available |
|------|----------|:-------------:|
| **stripe** | Payment processing and commission tracking | ✓ |

## Quick Start (Referral Programs)

1. Read [rewardful.md](integrations/rewardful.md) for Stripe-native affiliate setup.
2. Read [tolt.md](integrations/tolt.md) for SaaS affiliate program workflows.
3. Read [mention-me.md](integrations/mention-me.md) for enterprise referral programs.
4. Read [dub-co.md](integrations/dub-co.md) for link tracking and attribution.
5. Read [stripe.md](integrations/stripe.md) for payments and commission support.

## Security Notes

- Never store credentials in skill files, chat transcripts, or logs.
- Before any referral-account write/change action, ask for explicit user approval.
- Bundled CLI scripts are local references for implementation support. Use them for referral-account write/change actions only after user approval, with least-privilege credentials.
