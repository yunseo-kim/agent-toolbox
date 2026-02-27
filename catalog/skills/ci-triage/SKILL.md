---
name: ci-triage
description: "Triage CI failures and PR review comments with structured methodology. Use when investigating failing CI jobs, flaky tests, or analyzing PR review feedback. Covers blocker-first prioritization, failure categorization, local reproduction discipline, and parallel log analysis."
license: Sustainable Use License 1.0

metadata:
  domain: devops
  subdomain: ci-cd
  tags: "ci, testing, debugging, github-actions, pr-review, triage"
  author: "Yunseo Kim <dev@yunseo.kim>"
  lastUpdated: "12026-02-25"
  provenance: synthesized
---

# CI Triage

Use this skill when triaging CI failures, diagnosing flaky tests, or analyzing PR review comments. Provides a structured methodology for prioritizing and resolving CI issues efficiently.

## Triage Prioritization

Investigate failures in this order — higher-priority categories block everything below:

1. **Build failures** — Nothing else matters if the build doesn't compile
2. **Lint failures** — Quick fixes, clear them first
3. **Type check failures** — Often reveal real issues
4. **Test failures** — Investigate after the above pass
5. **Review comments** — Address after CI blockers are resolved

## Failure Categories

Classify each failure to guide your response:

| Category | Description | Typical Action |
|----------|-------------|----------------|
| **Infrastructure/Transient** | Network errors, 503s, service timeouts | Retry the job; not caused by code |
| **Build** | Compilation errors, missing dependencies | Fix imports, dependencies, or config |
| **Lint** | Formatting, style violations | Run formatter/linter autofix |
| **Type Check** | Type mismatches, missing declarations | Fix types at the source |
| **Assertion** | Wrong output, snapshot diffs, value mismatches | Debug the logic, update expectations |
| **Timeout** | Tests hanging, deadline exceeded | Find infinite loops, missing callbacks |
| **Port Binding** | EADDRINUSE, port conflicts | Fix test isolation, use dynamic ports |
| **Routing/SSR** | Wrong status codes, dynamic params unresolved | Check route config and handlers |
| **Source Maps** | Wrong file paths, incorrect line numbers | Check bundler source map settings |
| **CLI Output** | Missing warnings, wrong log order | Check stdio handling and ordering |

## Failure Handling Rules

- Investigate each failing job as if it is caused by your changes.
- Do NOT assume flakiness by default.
- Only classify as flaky if the same test fails on `main`/`master` with no related changes.
- Check the last 3 main branch CI runs for the same failure before dismissing.
- If a CI run includes a "Known Flaky Tests" section, use it as historical context, NOT as automatic dismissal.

## Common Failure Patterns

- **Rust check / build failures**: Run `cargo fmt -- --check`, fix with `cargo fmt`.
- **Lint / formatting failures**: Run the project formatter (e.g., `prettier --write`, `eslint --fix`).
- **Test failures**: Run the exact failing test file locally, matching the CI job's dev vs production mode.

## Local Reproduction

### Match CI Environment

Mirror the CI job's environment variables and mode when reproducing locally:

1. **Read the CI job config** — Extract env vars, test runner flags, and build mode from the job output.
2. **Set matching env vars** — Export all relevant variables before running tests.
3. **Match the build mode** — Dev vs production, bundler variant (webpack/turbopack/vite/esbuild/etc.).

```bash
# Example: capture output once, analyze multiple times
CI_ENV_VAR=value test-command test/path/to/test.ts > /tmp/test-output.log 2>&1
grep "FAIL\|Error" /tmp/test-output.log
grep -A5 "Error:" /tmp/test-output.log
tail -5 /tmp/test-output.log
```

### Isolation Rule

When validating module-resolution, import path, or dependency fixes, run the full build without skip-isolation flags. Shortcuts that bypass packaging or bundling can hide the real issue.

### One-Run Log Analysis

Capture the full test output once, then analyze without re-running:

```bash
# Capture
HEADLESS=true test-runner test/path/to/test.ts > /tmp/test-output.log 2>&1

# Analyze
grep "FAIL\|Error\|●" /tmp/test-output.log   # Find failures
grep -A5 "Error:" /tmp/test-output.log         # Error context
tail -5 /tmp/test-output.log                   # Exit status
```

## Structured CI Log Analysis

### Extracting Test Failures

For each failing CI job, extract structured data:

1. **TEST FILE** — Full path (e.g., `test/integration/auth/login.test.ts`)
2. **TEST NAME** — The specific test case name
3. **JOB TYPE** — CI job identifier (e.g., `unit-tests`, `e2e-chrome`, `integration-node18`)
4. **EXPECTED** — Exact expected value from the assertion
5. **RECEIVED** — Exact received value from the assertion
6. **CATEGORY** — One of: assertion | timeout | build | infrastructure | lint | type-check
7. **ROOT CAUSE** — One-sentence hypothesis
8. **LOG FILE** — Source log that led to the conclusion

### Deduplication

Before summarizing:

- Group all failures by **test file path**, not by CI job name.
- If multiple jobs fail the same test file, count the jobs but report once.
- Identify **systemic issues** — the same test failing across many job variants indicates a real bug, not flakiness.

### Parallel Analysis

For large CI suites with many failing jobs, parallelize the analysis:

- Batch 3-4 job logs per analysis pass (limit concurrency to avoid rate limits).
- Use a structured extraction template for each batch:

```
Analyze CI results for these jobs: [job-log-1] [job-log-2]
For each failing test, extract:
1. TEST FILE: (full path)
2. TEST NAME: (the specific test case name)
3. JOB TYPE: (the kind of job)
4. EXPECTED: (exact expected value from assertion)
5. RECEIVED: (exact received value from assertion)
6. CATEGORY: (assertion|timeout|build|infrastructure|lint|type-check)
7. ROOT CAUSE: (one sentence hypothesis)
8. LOG FILE: (analyzed log file that led to conclusion)
Return structured findings grouped by TEST FILE, not by job.

Also extract other failures not related to tests.
Identify if they are likely transient.
```

- Merge and deduplicate across batches.

## PR Review Comment Analysis

### Extracting Review Feedback

For each review thread or comment, extract:

1. **FILE** — The file path being reviewed
2. **REVIEWER** — Who left the comment
3. **STATUS** — Open/Resolved (threads) or Approved/Changes Requested/Commented (reviews)
4. **TYPE** — One of: code-style | bug | design | question | suggestion | nitpick | blocker
5. **SUMMARY** — One-sentence summary of the feedback
6. **ACTION REQUIRED** — Yes/No — does this require changes?
7. **PRIORITY** — High (changes requested, blocker), Medium (open suggestion), Low (resolved, nitpick)

### Extraction template:

```
Analyze PR review comments from these files: [review-data]
For each review thread/comment, extract:
1. FILE: (the file path being reviewed)
2. REVIEWER: (who left the comment)
3. STATUS: (Open/Resolved for threads, APPROVED/CHANGES_REQUESTED/COMMENTED for reviews)
4. TYPE: (code-style|bug|design|question|suggestion|nitpick|blocker)
5. SUMMARY: (one sentence summary of the feedback)
6. ACTION REQUIRED: (yes/no)
7. PRIORITY: (high if CHANGES_REQUESTED or blocker, medium if open suggestion, low if resolved or nitpick)
Return findings grouped by file path.
```

### Prioritize review findings:

1. **Blockers** — Must resolve before merge
2. **Changes Requested** — Reviewer explicitly wants changes
3. **Suggestions** — Worth considering but not blocking
4. **Nitpicks** — Style preferences, optional

## Summary Output Template

After analysis, produce a summary table:

```markdown
| # | Test / Issue | Category | Jobs Affected | Priority | Fix Recommendation |
|---|-------------|----------|---------------|----------|--------------------|
| 1 | path/to/test.ts - "test name" | assertion | 3/8 jobs | HIGH | Fix expected value |
| 2 | Build step - missing dep | build | all jobs | HIGH | Add dependency |
| 3 | path/to/flaky.ts - "timeout" | timeout | 1/8 jobs | LOW | Known flaky |
```

Recommend fixes by priority: HIGH > MEDIUM > LOW.
