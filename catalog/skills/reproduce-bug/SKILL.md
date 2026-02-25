---
name: reproduce-bug
description: Systematically reproduce a bug from a ticket or report with a failing regression test, using a structured hypothesis-driven methodology.
license: Sustainable Use License 1.0

metadata:
  domain: devops
  subdomain: testing
  tags: "debugging, bug-reproduction, regression-test, tdd"
  author: "Yunseo Kim <dev@yunseo.kim>"
  lastUpdated: "12026-02-26"
  provenance: adapted
---

# Bug Reproduction Framework

Given a bug report or ticket context ($ARGUMENTS), systematically reproduce the bug
with a failing regression test.

## Step 1: Parse Signals

Extract the following from the provided ticket/report context:
- **Error message / stack trace** (if provided)
- **Reproduction steps** (if provided)
- **Sample data or configuration** (if attached)
- **Affected area** (module, component, service, API, etc.)
- **Version where it broke / last working version**

## Step 2: Route to Test Strategy

Based on the affected area, pick the appropriate test layer and pattern:

| Area | Test Layer | Approach |
|------|-----------|----------|
| Business logic / service | Unit test | Mock dependencies, test pure logic |
| API endpoint | Integration test | HTTP client + test server |
| Database operation | Integration test | Test database + fixtures |
| UI component | Component test | Render + simulate interaction |
| CLI command | Integration test | Spawn process + assert output |
| Configuration | Unit test | Load config + validate values |
| End-to-end flow | E2E test | Full stack + browser/client automation |

Adapt the test layer to your project's testing infrastructure. Look for existing test
patterns in the codebase and follow them.

## Step 3: Locate Source Files

Find the source code for the affected area:
1. Search for the module/service/component mentioned in the report
2. Find shared utility files (common location for bugs)
3. Check for existing test files in the same area
4. Look at recent git history on affected files (`git log --oneline -10 -- <path>`)

## Step 4: Trace the Code Path

Read the source code and trace the execution path that triggers the bug:
- Follow the call chain from entry point to the failure
- Identify the specific line(s) where the bug manifests
- Note any error handling (or lack thereof) around the bug

## Step 5: Form Hypothesis

State a clear, testable hypothesis:
- "When [input/condition], the code does [wrong thing] because [root cause]"
- Identify the exact line(s) that need to change
- Predict what the test output will show

## Step 6: Find Test Patterns

Look for existing tests in the same area:
1. Check `test/` or `__tests__/` directories near the affected code
2. Identify which mock/setup patterns they use
3. Use the same patterns for consistency
4. If no tests exist, find the closest similar module's tests as a template

## Step 7: Write Failing Test

Write a regression test that:
- Uses the patterns found in Step 6
- Targets the specific hypothesis from Step 5
- Includes a comment referencing the ticket/issue ID
- Asserts the CORRECT behavior (test will fail on current code)
- Also includes a "happy path" test to prove the setup works

## Step 8: Run and Score

Run the test using the project's test runner.

Classify the result:

| Confidence | Criteria | Output |
|------------|----------|--------|
| **CONFIRMED** | Test fails consistently, failure matches hypothesis | Reproduction Report |
| **LIKELY** | Test fails but failure mode differs slightly | Report + caveat |
| **UNCONFIRMED** | Cannot trigger the failure | Report: what was tried |
| **SKIPPED** | Hit a hard bailout trigger | Report: why skipped |
| **ALREADY_FIXED** | Bug no longer reproduces on current code | Report: when fixed |

## Step 9: Iterate or Bail

If UNCONFIRMED after first attempt:
- Revisit hypothesis -- re-read the code path
- Try a different test approach or layer
- Maximum 3 attempts before declaring UNCONFIRMED

**Hard bailout triggers** (stop immediately):
- Requires real third-party API credentials
- Race condition / timing-dependent
- Requires specific cloud/enterprise infrastructure
- Requires manual UI interaction that cannot be scripted

## Output: Reproduction Report

Present findings in this format:

---

**Ticket:** [ID] -- [title]
**Confidence:** [CONFIRMED | LIKELY | UNCONFIRMED | SKIPPED | ALREADY_FIXED]

### Root Cause
[1-2 sentences explaining the bug mechanism]

### Location
| File | Lines | Issue |
|------|-------|-------|
| `path/to/file` | XX-YY | Description of the problem |

### Failing Test
`path/to/test/file` -- X/Y tests fail:
1. `test name` -- [failure description]

### Fix Hint
[Pseudocode or description of the fix approach]

---

## Important

- **DO NOT fix the bug** -- only reproduce it with a failing test
- **Leave test files in place** as evidence (don't commit unless asked)
- **Always redirect build output**: `command > build.log 2>&1`
- **DO NOT look at existing fix PRs** -- the goal is to reproduce from signals alone
