# Marketing Tools Registry (Email-Sequence Local Bundle)

Local subset bundled from upstream `coreyhaines31/marketingskills/tools/REGISTRY.md`.
This file is intentionally scoped to email tools and integrations referenced by this skill.

## Tool Index

| Tool | Category | API | MCP | CLI | SDK | Guide |
|------|----------|:---:|:---:|:---:|:---:|-------|
| customer-io | Email | ✓ | - | [✓](clis/customer-io.js) | ✓ | [customer-io.md](integrations/customer-io.md) |
| mailchimp | Email | ✓ | ✓ | [✓](clis/mailchimp.js) | ✓ | [mailchimp.md](integrations/mailchimp.md) |
| resend | Email | ✓ | ✓ | [✓](clis/resend.js) | ✓ | [resend.md](integrations/resend.md) |
| sendgrid | Email | ✓ | - | [✓](clis/sendgrid.js) | ✓ | [sendgrid.md](integrations/sendgrid.md) |
| kit | Email | ✓ | - | [✓](clis/kit.js) | ✓ | [kit.md](integrations/kit.md) |

## Email

| Tool | Best For | MCP Available |
|------|----------|:-------------:|
| **customer-io** | Behavior-based messaging | - |
| **mailchimp** | SMB email marketing | ✓ |
| **resend** | Developer-friendly transactional | ✓ |
| **sendgrid** | Transactional email at scale | - |
| **kit** | Creator/newsletter focused | - |

## Quick Start (Email Sequence)

1. Read [customer-io.md](integrations/customer-io.md) for behavior-triggered lifecycle messaging.
2. Read [mailchimp.md](integrations/mailchimp.md) for list management and SMB campaign workflows.
3. Read [resend.md](integrations/resend.md) for developer-centric transactional sending.
4. Read [sendgrid.md](integrations/sendgrid.md) for high-volume transactional infrastructure.
5. Read [kit.md](integrations/kit.md) for creator/newsletter automation.

## Security Notes

- Never store credentials in skill files, chat transcripts, or logs.
- Before any email-account write/change action, ask for explicit user approval.
- Bundled CLI scripts are local references for implementation support. Use them for email-account write/change actions only after user approval, with least-privilege credentials.
