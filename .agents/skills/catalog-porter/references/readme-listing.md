# README Listing Reference

Formats for updating `catalog/README.md` tables and `catalog/AGENTS.md` compact list.

---

## catalog/AGENTS.md Compact List

Location: the `CURRENT SKILLS` code block in `catalog/AGENTS.md`.

### Format

```
skill-name | domain/subdomain | provenance (source-shortname)
```

### Rules

- Insert in the correct domain group (comments mark groups: `# productivity`, `# development`, etc.).
- Maintain alphabetical order within each group.
- Source shortname: use the short form of the repo (e.g., `openclaw/openclaw`, `awesome-llm-apps`, `anthropics/skills`).
- Update the total count in the comment: `# N skills across M domains`.

### Example Entry

```
react-best-practices | development/frontend | ported (vercel-labs/agent-skills)
```

---

## catalog/README.md Tables

### Column Schema

| Column | Content |
|--------|---------|
| **Name** | Linked skill name |
| **Source** | Linked org/repo |
| **Stars** | GitHub stars badge |
| **Upstream License** | License badge |
| **Provenance** | Ported / Adapted / Synthesized / External |
| **Description** | One-line summary, no trailing period |

### Badge Patterns

**Stars badge:**
```markdown
![](https://img.shields.io/github/stars/<org>/<repo>?style=flat-square&logo=github)
```

**License badge (known license):**
```markdown
[![](https://img.shields.io/badge/license-<license-url-encoded>-97ca00?style=flat-square)](https://github.com/<org>/<repo>/blob/<branch>/LICENSE)
```

Common license URL encodings:
- MIT: `MIT`
- Apache 2.0: `Apache%202.0`
- BSD 3-Clause: `BSD%203--Clause`
- SUL 1.0: `SUL%201.0`
- Proprietary: `Proprietary` (use red color: `-red` instead of `-97ca00`)

**Multi-license badge (synthesized):**
```markdown
[![](https://img.shields.io/badge/license-MIT%20%2F%20Apache%202.0-97ca00?style=flat-square)](skills/<name>/NOTICE.md)
```

### Row Templates by Provenance

**Ported / Adapted (links to catalog):**
```markdown
| [<display-name>](skills/<dir-name>) | [<org>/<repo>](https://github.com/<org>/<repo>) | ![](https://img.shields.io/github/stars/<org>/<repo>?style=flat-square&logo=github) | [![](https://img.shields.io/badge/license-<license>-97ca00?style=flat-square)](https://github.com/<org>/<repo>/blob/<branch>/LICENSE) | Ported | <description> |
```

**Synthesized (links to catalog, multi-license):**
```markdown
| [<display-name>](skills/<dir-name>) | [<org1>/<repo1>](https://github.com/<org1>/<repo1>), [<org2>/<repo2>](https://github.com/<org2>/<repo2>) | --- | [![](https://img.shields.io/badge/license-<lic1>%20%2F%20<lic2>-97ca00?style=flat-square)](skills/<dir-name>/NOTICE.md) | Synthesized | <description> |
```

**External (links to upstream):**
```markdown
| [<display-name>](https://github.com/<org>/<repo>/tree/<branch>/<path>) | [<org>/<repo>](https://github.com/<org>/<repo>) | ![](https://img.shields.io/github/stars/<org>/<repo>?style=flat-square&logo=github) | ![](https://img.shields.io/github/license/<org>/<repo>?style=flat-square) | External | <description> |
```

### Section Structure

Tables are grouped by domain, with subsections for subdomains:

```markdown
### <Domain Display Name>

#### <Subdomain Display Name>

| Name | Source | Stars | Upstream License | Provenance | Description |
|:----:|:------:|:-----:|:----------------:|:----------:|:------------|
| ... | ... | ... | ... | ... | ... |
```

If a subdomain section doesn't exist yet, create it following the existing header pattern. Check existing sections for the correct display name and heading level.

### References Table

At the bottom of catalog/README.md, there's a References table listing all upstream sources:

```markdown
## References

| Source | Stars | Description |
|:-------|:-----:|:------------|
| [<org>/<repo>](https://github.com/<org>/<repo>) | ![](https://img.shields.io/github/stars/<org>/<repo>?style=flat-square&logo=github) | <one-line repo description> |
```

Add a row here for any NEW upstream source not already listed.
