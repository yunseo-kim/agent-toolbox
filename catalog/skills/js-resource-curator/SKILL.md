---
name: js-resource-curator
description: >
  Find, evaluate, and maintain high-quality external resources for JavaScript
  documentation, including trusted source lists, link auditing, and publication
  date guidelines for ES features. Use when adding resources, refreshing pages,
  or running link audits.
license: Sustainable Use License 1.0

metadata:
  domain: documentation
  subdomain: technical-docs
  tags: "resources, links, curation, javascript, documentation, audit"
  author: "Yunseo Kim <dev@yunseo.kim>"
  lastUpdated: "12026-02-25"
  provenance: adapted
---

# Skill: Resource Curator for JavaScript Documentation

Use this skill to find, evaluate, add, and maintain high-quality external resources (articles, videos, courses) for JavaScript documentation pages. This includes auditing existing resources for broken links and outdated content.

## When to Use

- Adding resources to a new documentation page
- Refreshing resources on existing pages
- Auditing for broken or outdated links
- Reviewing community-contributed resources
- Periodic link maintenance

## Resource Curation Methodology

Follow these five phases for comprehensive resource curation.

### Phase 1: Audit Existing Resources

Before adding new resources, audit what's already there:

1. **Check link accessibility** — Does each link return 200?
2. **Verify content accuracy** — Is the content still correct?
3. **Check publication dates** — Is it too old for the topic?
4. **Identify outdated content** — Does it use old syntax/patterns?
5. **Review descriptions** — Are they specific or generic?

### Phase 2: Identify Resource Gaps

Compare current resources against targets:

| Section | Target Count | Icon |
|---------|--------------|------|
| Reference | 2-4 MDN links | `book` |
| Articles | 4-6 articles | `newspaper` |
| Videos | 3-4 videos | `video` |
| Courses | 1-3 (optional) | `graduation-cap` |
| Books | 1-2 (optional) | `book` |

Ask:
- Are there enough resources for beginners AND advanced learners?
- Is there visual content (diagrams, animations)?
- Are official references (MDN) included?
- Is there diversity in teaching styles?

### Phase 3: Find New Resources

Search trusted sources using targeted queries:

**For Articles:**
```
[concept] javascript tutorial site:javascript.info
[concept] javascript explained site:freecodecamp.org
[concept] javascript site:dev.to
[concept] javascript deep dive site:2ality.com
[concept] javascript guide site:css-tricks.com
```

**For Videos:**
```
YouTube: [concept] javascript explained
YouTube: [concept] javascript tutorial
YouTube: jsconf [concept]
YouTube: [concept] javascript fireship
YouTube: [concept] javascript web dev simplified
```

**For MDN:**
```
[concept] site:developer.mozilla.org
[API name] MDN
```

### Phase 4: Write Descriptions

Every resource needs a specific, valuable description:

**Formula:**
```
Sentence 1: What makes this resource unique OR what it specifically covers
Sentence 2: Why reader should click (what they'll gain, who it's best for)
```

### Phase 5: Format and Organize

- Use correct formatting with proper icons
- Order resources logically (foundational first, advanced later)
- Ensure consistent formatting

---

## Trusted Sources

### Reference Sources (Priority Order)

| Priority | Source | URL | Best For |
|----------|--------|-----|----------|
| 1 | MDN Web Docs | developer.mozilla.org | API docs, guides, compatibility |
| 2 | ECMAScript Spec | tc39.es/ecma262 | Authoritative behavior |
| 3 | Node.js Docs | nodejs.org/docs | Node-specific APIs |
| 4 | Web.dev | web.dev | Performance, best practices |
| 5 | Can I Use | caniuse.com | Browser compatibility |

### Article Sources (Priority Order)

| Priority | Source | Why Trusted |
|----------|--------|-------------|
| 1 | javascript.info | Comprehensive, exercises, well-maintained |
| 2 | MDN Guides | Official, accurate, regularly updated |
| 3 | freeCodeCamp | Beginner-friendly, practical |
| 4 | 2ality (Dr. Axel) | Deep technical dives, spec-focused |
| 5 | CSS-Tricks | DOM, visual topics, well-written |
| 6 | dev.to (Lydia Hallie) | Visual explanations, animations |
| 7 | LogRocket Blog | Practical tutorials, real-world |
| 8 | Smashing Magazine | In-depth, well-researched |
| 9 | Digital Ocean | Clear tutorials, examples |
| 10 | Kent C. Dodds | Testing, React, best practices |

### Video Creators (Priority Order)

| Priority | Creator | Style | Best For |
|----------|---------|-------|----------|
| 1 | Fireship | Fast, modern, entertaining | Quick overviews, modern JS |
| 2 | Web Dev Simplified | Clear, beginner-friendly | Beginners, fundamentals |
| 3 | Fun Fun Function | Deep-dives, personality | Understanding "why" |
| 4 | Traversy Media | Comprehensive crash courses | Full topic coverage |
| 5 | JSConf/dotJS | Expert conference talks | Advanced, in-depth |
| 6 | Academind | Thorough explanations | Complete understanding |
| 7 | The Coding Train | Creative, visual | Visual learners |
| 8 | Wes Bos | Practical, real-world | Applied learning |
| 9 | The Net Ninja | Step-by-step tutorials | Following along |
| 10 | Programming with Mosh | Professional, clear | Career-focused |

### Course Sources

| Source | Type | Notes |
|--------|------|-------|
| javascript.info | Free | Comprehensive, exercises |
| Piccalilli | Free | Well-written, modern |
| freeCodeCamp | Free | Project-based |
| Frontend Masters | Paid | Expert instructors |
| Egghead.io | Paid | Short, focused lessons |
| Udemy (top-rated) | Paid | Check reviews carefully |
| Codecademy | Freemium | Interactive |

---

## Quality Criteria

### Must Have (Required)

- [ ] **Link works** — Returns 200 (not 404, 301, 5xx)
- [ ] **JavaScript-focused** — Not primarily about C#, Python, Java, etc.
- [ ] **Technically accurate** — No factual errors or anti-patterns
- [ ] **Accessible** — Free or has meaningful free preview

### Should Have (Preferred)

- [ ] **Recent enough** — See publication date guidelines below
- [ ] **Reputable source** — From trusted sources list or well-known creator
- [ ] **Unique perspective** — Not duplicate of existing resources
- [ ] **Appropriate depth** — Matches concept complexity
- [ ] **Good engagement** — Positive comments, high views (for videos)

### Red Flags (Reject)

| Red Flag | Why It Matters |
|----------|----------------|
| Uses `var` everywhere | Outdated for ES6+ topics |
| Uses callbacks for Promises content | Outdated async patterns |
| Teaches jQuery as modern DOM manipulation | Misleading for modern JS |
| Primarily other languages | Wrong focus |
| Hard paywall (no preview) | Inaccessible |
| Pre-2015 for modern topics | Likely outdated |
| Low quality comments | Often indicates issues |
| Factual errors | Spreads misinformation |
| Clickbait title, thin content | Wastes reader time |

---

## Publication Date Guidelines

| Topic Category | Minimum Year | Reasoning |
|----------------|--------------|-----------|
| **ES6+ Features** | 2015+ | ES6 released June 2015 |
| **Promises** | 2015+ | Native Promises in ES6 |
| **async/await** | 2017+ | ES2017 feature |
| **ES Modules** | 2018+ | Stable browser support |
| **Optional chaining (?.)** | 2020+ | ES2020 feature |
| **Nullish coalescing (??)** | 2020+ | ES2020 feature |
| **Top-level await** | 2022+ | ES2022 feature |
| **Fundamentals** (closures, scope, this) | Any | Core concepts don't change |
| **DOM manipulation** | 2018+ | Modern APIs preferred |
| **Fetch API** | 2017+ | Widespread support |

**Rule of thumb:** For time-sensitive topics, prefer content from the last 3-5 years. For fundamentals, older classic content is often excellent.

---

## Description Writing Guide

### The Formula

```
Sentence 1: What makes this resource unique OR what it specifically covers
Sentence 2: Why reader should click (what they'll gain, who it's best for)
```

### Good Examples

```
"Animated GIFs showing the call stack, microtask queue, and event loop in action.
The visuals make Promise execution order finally click for visual learners."

"The legendary JSConf talk that made the event loop click for millions of developers.
Philip Roberts' live visualizations are the gold standard — a must-watch."

"Kyle Simpson's deep dive into JavaScript's scope mechanics and closure behavior.
Goes beyond the basics into edge cases and mental models for truly understanding scope."

"Quick, clear explanation covering Promise creation, chaining, and error handling.
Perfect starting point if you're new to async JavaScript."

"The pizza-and-drinks ordering analogy makes parallel vs sequential execution crystal clear.
Essential reading once you know async/await basics but want to write faster code."
```

### Bad Examples (Avoid)

```
"A comprehensive guide to Promises in JavaScript."         <- TOO GENERIC
"This video explains closures in JavaScript."              <- NO VALUE PROPOSITION
"Everything you need to know about JavaScript."            <- VAGUE, NO SPECIFICS
"A video about understanding the event loop."              <- JUST RESTATING THE TITLE
```

### Words and Phrases to Avoid

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| "comprehensive guide to..." | Vague, overused | Specify what's covered |
| "learn all about..." | Generic | What specifically will they learn? |
| "everything you need to know..." | Hyperbolic | Be specific |
| "great tutorial on..." | Subjective filler | Why is it great? |
| "explains X" | Too basic | How does it explain? What's unique? |
| "in-depth look at..." | Vague | What depth? What aspect? |

### Words and Phrases That Work

| Good Phrase | Example |
|-------------|---------|
| "step-by-step walkthrough" | "Step-by-step walkthrough of building a Promise from scratch" |
| "visual explanation" | "Visual explanation with animated diagrams" |
| "deep dive into" | "Deep dive into V8's optimization strategies" |
| "practical examples of" | "Practical examples of closures in React hooks" |
| "the go-to reference for" | "The go-to reference for array method signatures" |
| "finally makes X click" | "Finally makes prototype chains click" |
| "perfect for beginners" | "Perfect for beginners new to async code" |
| "covers X, Y, and Z" | "Covers creation, chaining, and error handling" |

---

## Link Audit Process

### Step 1: Check Each Link

For each resource in the documentation page:

1. **Click the link** — Does it load?
2. **Note the HTTP status:**

| Status | Meaning | Action |
|--------|---------|--------|
| 200 | OK | Keep, continue to content check |
| 301/302 | Redirect | Update to final URL |
| 404 | Not Found | Remove or find replacement |
| 403 | Forbidden | Check manually, may be geo-blocked |
| 5xx | Server Error | Retry later, may be temporary |

### Step 2: Content Verification

For each accessible link:

1. **Skim the content** — Is it still accurate?
2. **Check the date** — When was it published/updated?
3. **Verify JavaScript focus** — Is it primarily about JS?
4. **Look for red flags** — Anti-patterns, errors, outdated syntax

### Step 3: Description Review

For each resource:

1. **Read current description** — Is it specific?
2. **Compare to actual content** — Does it match?
3. **Check for generic phrases** — "comprehensive guide", etc.
4. **Identify improvements** — How can it be more specific?

### Step 4: Gap Analysis

After auditing all resources:

1. **Count by section** — Do we meet targets?
2. **Check diversity** — Beginner AND advanced? Visual AND text?
3. **Identify missing types** — No MDN? No videos?
4. **Note recommendations** — What should we add?

---

## Resource Ordering

Within each section, order resources:
1. **Most foundational/beginner-friendly first**
2. **Official references before community content**
3. **Most highly recommended prominently placed**
4. **Advanced/niche content last**

---

## Resource Audit Report Template

Use this template to document audit findings.

```markdown
# Resource Audit Report: [Page Title]

**File:** `[file path]`
**Date:** YYYY-MM-DD
**Auditor:** [Name]

---

## Summary

| Metric | Count |
|--------|-------|
| Total Resources | XX |
| Working Links (200) | XX |
| Broken Links (404) | XX |
| Redirects (301/302) | XX |
| Outdated Content | XX |
| Generic Descriptions | XX |

## Resource Count vs Targets

| Section | Current | Target | Status |
|---------|---------|--------|--------|
| Reference (MDN) | X | 2-4 | |
| Articles | X | 4-6 | |
| Videos | X | 3-4 | |
| Courses | X | 0-3 | |

---

## Broken Links (Remove or Replace)

| Resource | Line | URL | Status | Action |
|----------|------|-----|--------|--------|
| [Title] | XX | [URL] | 404 | Remove / Replace with [alternative] |

---

## Redirects (Update URLs)

| Resource | Line | Old URL | New URL |
|----------|------|---------|---------|
| [Title] | XX | [old] | [new] |

---

## Outdated Resources (Consider Replacing)

| Resource | Line | Issue | Recommendation |
|----------|------|-------|----------------|
| [Title] | XX | [why it's outdated] | Replace with [modern alternative] |

---

## Description Improvements Needed

| Resource | Line | Current | Suggested |
|----------|------|---------|-----------|
| [Title] | XX | "[generic text]" | "[specific description with value prop]" |

---

## Missing Resources (Recommendations)

| Type | Gap | Suggested Resource | URL |
|------|-----|-------------------|-----|
| Reference | No main MDN link | [Topic] - MDN | [URL] |
| Article | No beginner guide | [Title] - javascript.info | [URL] |
| Video | No visual explanation | [Title] - [Creator] | [URL] |
| Article | No advanced deep-dive | [Title] - 2ality | [URL] |

---

## Action Items

### High Priority (Do First)
1. **Remove broken link:** [Title] (line XX)
2. **Add missing MDN reference:** [Topic]
3. **Replace outdated resource:** [Title] with [alternative]

### Medium Priority
1. **Update redirect URL:** [Title] (line XX)
2. **Improve description:** [Title] (line XX)
3. **Add beginner-friendly article**

### Low Priority
1. **Add additional video resource**
2. **Consider adding course section**

---

## Verification Checklist

After making changes:

- [ ] All broken links removed or replaced
- [ ] All redirect URLs updated
- [ ] Outdated resources replaced
- [ ] Generic descriptions rewritten
- [ ] Missing resource types added
- [ ] Resource counts meet targets
- [ ] All new links verified working
- [ ] All descriptions are specific and valuable
```

---

## Quality Checklist

### Link Verification
- [ ] All links return 200 (not 404, 301)
- [ ] No redirect chains
- [ ] No hard paywalls without notice
- [ ] All URLs are HTTPS where available

### Content Quality
- [ ] All resources are JavaScript-focused
- [ ] No resources teaching anti-patterns
- [ ] Publication dates appropriate for topic
- [ ] Mix of beginner and advanced content
- [ ] Visual and text resources included

### Description Quality
- [ ] All descriptions are specific (not generic)
- [ ] Descriptions explain unique value
- [ ] No "comprehensive guide to..." phrases
- [ ] Each description is 2 sentences
- [ ] Descriptions match actual content

### Completeness
- [ ] 2-4 MDN/official references
- [ ] 4-6 quality articles
- [ ] 3-4 quality videos
- [ ] Resources ordered logically
- [ ] Diversity in teaching styles

---

## Summary

When curating resources for a JavaScript documentation page:

1. **Audit first** — Check all existing links and content
2. **Identify gaps** — Compare against targets (2-4 refs, 4-6 articles, 3-4 videos)
3. **Find quality resources** — Search trusted sources
4. **Write specific descriptions** — What's unique + why read/watch
5. **Format correctly** — Proper icons, ordering, consistent style
6. **Document changes** — Use the audit report template

**Remember:** Resources should enhance learning, not pad the page. Every link should offer genuine value. Quality over quantity — a few excellent resources beat many mediocre ones.
