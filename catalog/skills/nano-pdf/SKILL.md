---
name: nano-pdf
description: >
  Lightweight PDF processing from the command line. Use when working with
  PDF files for extraction, conversion, or manipulation.
license: Sustainable Use License 1.0

metadata:
  domain: productivity
  tags: "pdf, document, processing, cli"
  author: "cpojer <christoph.pojer@gmail.com>"
  lastUpdated: "12026-01-31"
  provenance: ported
---

# nano-pdf

Use `nano-pdf` to apply edits to a specific page in a PDF using a natural-language instruction.

## Quick start

```bash
nano-pdf edit deck.pdf 1 "Change the title to 'Q3 Results' and fix the typo in the subtitle"
```

Notes:

- Page numbers are 0-based or 1-based depending on the tool’s version/config; if the result looks off by one, retry with the other.
- Always sanity-check the output PDF before sending it out.
