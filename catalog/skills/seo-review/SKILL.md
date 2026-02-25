---
name: seo-review
description: >
  Perform a focused SEO audit on documentation and content pages to maximize
  search visibility, featured snippet optimization, and ranking potential.
  Use when publishing new pages, optimizing underperforming content, or running
  periodic content audits.
license: Sustainable Use License 1.0

metadata:
  domain: documentation
  subdomain: technical-docs
  tags: "seo, search, content-optimization, documentation, audit"
  author: "Yunseo Kim <dev@yunseo.kim>"
  lastUpdated: "12026-02-25"
  provenance: adapted
---

# Skill: SEO Audit for Documentation Pages

Use this skill to perform a focused SEO audit on documentation or content pages. The goal is to maximize search visibility for developers and readers searching for topics you cover.

## When to Use

- Before publishing a new documentation page
- When optimizing underperforming pages
- Periodic content audits
- After major content updates
- When targeting new keywords

## Goal

Each documentation page should rank for searches like:
- "what is [topic] in [technology]"
- "how does [topic] work"
- "[topic] explained"
- "[topic] tutorial"
- "[topic] example"

---

## SEO Audit Methodology

Follow these five steps for a complete SEO audit.

### Step 1: Identify Target Keywords

Before auditing, identify the keyword cluster for the topic.

#### Keyword Cluster Template

| Type | Pattern | Example (Closures) |
|------|---------|-------------------|
| **Primary** | [topic] [technology] | closures JavaScript |
| **What is** | what is [topic] in [technology] | what is a closure in JavaScript |
| **How does** | how does [topic] work | how do closures work |
| **How to** | how to use/create [topic] | how to use closures |
| **Why** | why use [topic] | why use closures |
| **Examples** | [topic] examples | closure examples |
| **vs** | [topic] vs [related] | closures vs scope |
| **Interview** | [topic] interview questions | closure interview questions |

### Step 2: On-Page SEO Audit

Check all on-page SEO elements systematically using the checklists below.

### Step 3: Featured Snippet Optimization

Verify content is structured to win featured snippets.

### Step 4: Internal Linking Audit

Check the internal link structure.

### Step 5: Generate Report

Document findings using the report template at the bottom of this skill.

---

## Audit Checklists

### Title Tag Checklist (4 points)

| # | Check | Points | How to Verify |
|---|-------|--------|---------------|
| 1 | Length 50-60 characters | 1 | Count characters in `title` frontmatter |
| 2 | Primary keyword in first half | 1 | Topic name appears early |
| 3 | Contains technology/context identifier | 1 | Check title ending (e.g., "in JavaScript", "with React") |
| 4 | Contains compelling hook | 1 | Promises value/benefit to reader |

**Scoring:**
- 4/4: Excellent
- 3/4: Good, minor improvements possible
- 0-2/4: Needs significant work

**Title Formula:**
```
[Topic]: [What You'll Understand] in [Technology]
```

**Good Examples:**

| Topic | Title (with character count) |
|-------|------------------------------|
| Closures | "Closures: How Functions Remember Their Scope in JavaScript" (58 chars) |
| Dependency Injection | "Dependency Injection: Writing Testable Code in Python" (53 chars) |
| CORS | "CORS: How Cross-Origin Requests Work in Web APIs" (49 chars) |

**Bad Examples:**

| Issue | Bad Title | Better Title |
|-------|-----------|--------------|
| Too short | "Closures" | "Closures: How Functions Remember Their Scope in JavaScript" |
| Too long | "Understanding JavaScript Closures and How They Work with Examples" (66) | Trim to 50-60 chars |
| No hook | "JavaScript Closures" | Add benefit: "How Functions Remember Their Scope" |

---

### Meta Description Checklist (4 points)

| # | Check | Points | How to Verify |
|---|-------|--------|---------------|
| 1 | Length 150-160 characters | 1 | Count characters in `description` frontmatter |
| 2 | Starts with action word | 1 | "Learn", "Understand", "Discover" (NOT "Master") |
| 3 | Contains primary keyword | 1 | Topic name + technology present |
| 4 | Promises specific value | 1 | Lists what reader will learn |

**Description Formula:**
```
[Action word] [what the topic is] in [technology]. [Specific things covered]: [topic 1], [topic 2], and [topic 3].
```

**Good Examples:**

| Topic | Description |
|-------|-------------|
| Closures | "Learn JavaScript closures and how functions remember their scope. Covers lexical scoping, practical use cases, memory considerations, and common closure patterns." (159 chars) |
| CORS | "Understand how CORS works in web APIs. Learn about preflight requests, allowed origins, credentials handling, and common configuration mistakes." (144 chars) |

**Bad Examples:**

| Issue | Bad Description | Fix |
|-------|-----------------|-----|
| Too short | "Learn about closures" | Expand to 150-160 chars with specifics |
| Starts with "Master" | "Master JavaScript closures..." | "Learn JavaScript closures..." |
| Too vague | "A guide to closures" | List specific topics covered |

---

### Keyword Placement Checklist (5 points)

| # | Check | Points | How to Verify |
|---|-------|--------|---------------|
| 1 | Primary keyword in title | 1 | Check frontmatter `title` |
| 2 | Primary keyword in meta description | 1 | Check frontmatter `description` |
| 3 | Primary keyword in first 100 words | 1 | Check opening paragraphs |
| 4 | Keyword in at least one H2 heading | 1 | Scan all `##` headings |
| 5 | No keyword stuffing | 1 | Content reads naturally |

**Keyword Placement Map:**

```
CRITICAL (Must have keyword)
  - title frontmatter
  - description frontmatter
  - First paragraph (within 100 words)
  - At least one H2 heading

RECOMMENDED (Include naturally)
  - "What you'll learn" summary box
  - H3 subheadings
  - Key Takeaways section
  - First sentence after major H2s

AVOID
  - Same phrase >4 times per 1000 words
  - Forcing keywords where pronouns work better
  - Awkward sentence structures to fit keywords
```

---

### Content Structure Checklist (6 points)

| # | Check | Points | How to Verify |
|---|-------|--------|---------------|
| 1 | Opens with question hook | 1 | First paragraph asks engaging question |
| 2 | Code example or key insight in first 200 words | 1 | Practical content appears early |
| 3 | "What you'll learn" summary present | 1 | Summary box or list after opening |
| 4 | Short paragraphs (2-4 sentences) | 1 | Scan content for long blocks |
| 5 | 1,500+ words | 1 | Word count check |
| 6 | Key terms bolded on first mention | 1 | Important terms use `**bold**` |

**Content Length Guidelines:**

| Length | Assessment |
|--------|------------|
| <1,000 words | Too thin — add depth |
| 1,000-1,500 | Minimum viable |
| 1,500-2,500 | Good |
| 2,500-4,000 | Excellent |
| >4,000 | Consider splitting |

---

### Featured Snippet Checklist (4 points)

| # | Check | Points | How to Verify |
|---|-------|--------|---------------|
| 1 | "What is X" has 40-60 word definition | 1 | Count words in first paragraph after "What is" H2 |
| 2 | At least one H2 is phrased as question | 1 | Check for "What is", "How does", "Why" H2s |
| 3 | Numbered steps for "How to" content | 1 | Uses numbered list or step component |
| 4 | Comparison tables (if applicable) | 1 | Tables for "X vs Y" content |

**Featured Snippet Formats:**

| Query Type | Winning Format | Your Content |
|------------|---------------|--------------|
| "What is X" | Paragraph | 40-60 word definition after H2, bold keyword |
| "How to X" | Numbered list | Numbered steps |
| "X vs Y" | Table | Comparison table with clear column headers |
| "Types of X" | Bullet list | Bold type name + description |
| "[X] examples" | Code block | Code examples with brief explanations |

**Definition Paragraph Example (40-60 words):**

```markdown
## What is a Closure?

A **closure** is a function that retains access to variables from its outer
(enclosing) scope, even after that outer function has finished executing.
Closures are created every time a function is created, allowing inner functions
to "remember" and access their lexical environment.
```

---

### Internal Linking Checklist (4 points)

| # | Check | Points | How to Verify |
|---|-------|--------|---------------|
| 1 | 3-5 related pages linked in body | 1 | Count internal links in prose |
| 2 | Descriptive anchor text | 1 | No "click here", "here", "this" |
| 3 | Prerequisites noted with links | 1 | Warning/note with links at start |
| 4 | Related content section has 3-4 items | 1 | Related section at end with links |

**Good Anchor Text:**

| Bad | Good |
|-----|------|
| "click here" | "event loop guide" |
| "here" | "our Promises documentation" |
| "this article" | "understanding the call stack" |
| "read more" | "dependency injection patterns" |

---

### Technical SEO Checklist (3 points)

| # | Check | Points | How to Verify |
|---|-------|--------|---------------|
| 1 | Single H1 per page | 1 | Only one `#` heading (the title) |
| 2 | URL slug contains keyword | 1 | Descriptive slug, not IDs |
| 3 | No orphan pages | 1 | Page is linked from at least one other page |

**URL/Slug Best Practices:**

| Good | Bad |
|------|-----|
| `/docs/closures` | `/docs/c1` |
| `/docs/event-loop` | `/docs/topic-7` |
| `/api/authentication` | `/api/abc123` |

Rules for slugs:
- Include primary keyword
- Use hyphens, not underscores
- Keep under 50 characters
- Lowercase only

---

## Scoring System

### Total Points Available: 30

| Category | Max Points |
|----------|------------|
| Title Tag | 4 |
| Meta Description | 4 |
| Keyword Placement | 5 |
| Content Structure | 6 |
| Featured Snippets | 4 |
| Internal Linking | 4 |
| Technical SEO | 3 |
| **Total** | **30** |

### Score Interpretation

| Score | Percentage | Status | Action |
|-------|------------|--------|--------|
| 27-30 | 90-100% | Excellent | Ready to publish |
| 23-26 | 75-89% | Good | Minor optimizations needed |
| 17-22 | 55-74% | Fair | Several improvements needed |
| 0-16 | <55% | Poor | Significant work required |

---

## Common SEO Issues and Fixes

### Title Tag Issues

| Issue | Fix |
|-------|-----|
| Too short (<50 chars) | Add benefit clause: "How X Works" |
| Too long (>60 chars) | Trim to essential keywords + hook |
| Missing keyword | Lead with topic name |
| No hook | Add what reader will understand |

### Meta Description Issues

| Issue | Fix |
|-------|-----|
| Too short (<120 chars) | Add specifics about what's covered |
| Too long (>160 chars) | Edit ruthlessly, keep key information |
| Starts with "Master" | Use "Learn", "Understand", "Discover" |
| Too vague | List specific subtopics: "Covers X, Y, and Z" |

### Content Structure Issues

| Issue | Fix |
|-------|-----|
| No question hook | Start with "How does...?" or "Why...?" |
| Key content too late | Move practical example to first 200 words |
| Missing summary box | Add "What you'll learn" list |
| Long paragraphs | Break into 2-4 sentence chunks |
| Under 1,500 words | Add more depth, examples, edge cases |

### Featured Snippet Issues

| Issue | Fix |
|-------|-----|
| No "What is" definition | Add 40-60 word definition paragraph |
| Definition too long | Tighten to 40-60 words |
| No question H2s | Add "What is X?" or "How does X work?" H2 |
| Steps not numbered | Use numbered markdown list |
| No comparison tables | Add table for "X vs Y" sections |

### Internal Linking Issues

| Issue | Fix |
|-------|-----|
| No internal links | Add 3-5 links to related pages |
| Bad anchor text | Replace "click here" with descriptive text |
| No prerequisites | Add note with prerequisite links |
| Empty Related section | Add 3-4 links to related content |

---

## SEO Audit Report Template

Use this template to document your findings.

```markdown
# SEO Audit Report: [Page Title]

**File:** `[file path]`
**Date:** YYYY-MM-DD
**Auditor:** [Name]
**Overall Score:** XX/30 (XX%)
**Status:** Excellent | Needs Work | Poor

---

## Score Summary

| Category | Score | Status |
|----------|-------|--------|
| Title Tag | X/4 | |
| Meta Description | X/4 | |
| Keyword Placement | X/5 | |
| Content Structure | X/6 | |
| Featured Snippets | X/4 | |
| Internal Linking | X/4 | |
| Technical SEO | X/3 | |
| **Total** | **X/30** | |

---

## Target Keywords

**Primary Keyword:** [e.g., "JavaScript closures"]
**Secondary Keywords:**
- [keyword 1]
- [keyword 2]
- [keyword 3]

**Search Intent:** Informational / How-to / Comparison

---

## Title Tag Analysis

**Current Title:** "[current title]"
**Character Count:** XX characters
**Score:** X/4

| Check | Status | Notes |
|-------|--------|-------|
| Length 50-60 chars | | XX characters |
| Primary keyword in first half | | |
| Contains technology context | | |
| Contains compelling hook | | |

**Recommended Title:** "[suggested title]" (XX chars)

---

## Meta Description Analysis

**Current Description:** "[current description]"
**Character Count:** XX characters
**Score:** X/4

| Check | Status | Notes |
|-------|--------|-------|
| Length 150-160 chars | | XX characters |
| Starts with action word | | |
| Contains primary keyword | | |
| Promises specific value | | |

**Recommended Description:** "[suggested description]" (XX chars)

---

## Keyword Placement Analysis

**Score:** X/5

| Location | Present | Notes |
|----------|---------|-------|
| Title | | |
| Meta description | | |
| First 100 words | | Found at word XX |
| H2 heading | | Found in: "[H2 text]" |
| Natural reading | | |

---

## Content Structure Analysis

**Word Count:** X,XXX words
**Score:** X/6

| Check | Status | Notes |
|-------|--------|-------|
| Question hook opening | | |
| Key content in first 200 words | | |
| "What you'll learn" summary | | |
| Short paragraphs | | |
| 1,500+ words | | |
| Bolded key terms | | |

---

## Featured Snippet Analysis

**Score:** X/4

| Check | Status | Notes |
|-------|--------|-------|
| 40-60 word definition | | Currently XX words |
| Question-format H2 | | |
| Numbered steps | | |
| Comparison tables | | |

---

## Internal Linking Analysis

**Score:** X/4

| Check | Status | Notes |
|-------|--------|-------|
| 3-5 internal links in body | | Found X links |
| Descriptive anchor text | | |
| Prerequisites noted | | |
| Related content section | | X items present |

---

## Technical SEO Analysis

**Score:** X/3

| Check | Status | Notes |
|-------|--------|-------|
| Single H1 per page | | |
| URL slug contains keyword | | |
| Not an orphan page | | |

---

## Priority Fixes

### High Priority
1. **[Issue]** — Current: [what it is now]. Fix: [what it should be].

### Medium Priority
1. **[Issue]** — Recommendation: [fix].

### Low Priority
1. **[Issue]** — Suggestion: [improvement].

---

## Final Recommendation

**Ready to Publish:** Yes / No — [reason]
**Next Review Date:** [when to re-audit]
```

---

## Quick Reference

### Character Counts

| Element | Ideal Length |
|---------|--------------|
| Title | 50-60 characters |
| Meta Description | 150-160 characters |
| Definition paragraph | 40-60 words |

### Keyword Density

- Don't exceed 3-4 mentions of exact phrase per 1,000 words
- Use variations naturally

### Scannable Content Patterns

| Element | SEO Benefit | When to Use |
|---------|-------------|-------------|
| Short paragraphs | Reduces bounce rate | Always (2-4 sentences max) |
| Bullet lists | Often become featured snippets | Lists of 3+ items |
| Numbered lists | "How to" snippet potential | Sequential steps |
| Tables | High snippet potential | Comparisons, reference data |
| Bold text | Highlights keywords for crawlers | First mention of key terms |
| Headings (H2/H3) | Structure signals to search engines | Every major topic shift |

---

## Summary

When auditing a documentation page for SEO:

1. **Identify target keywords** using the keyword cluster template
2. **Check title tag** — 50-60 chars, keyword first, hook, technology context
3. **Check meta description** — 150-160 chars, action word, keyword, specific value
4. **Verify keyword placement** — Title, description, first 100 words, H2
5. **Audit content structure** — Question hook, early practical content, summary box, short paragraphs
6. **Optimize for featured snippets** — 40-60 word definitions, numbered steps, tables
7. **Check internal linking** — 3-5 links, good anchors, related content section
8. **Generate report** — Document score, issues, and prioritized fixes

SEO is about making content easy to find for people who need it. Every optimization should also improve the reader experience.
