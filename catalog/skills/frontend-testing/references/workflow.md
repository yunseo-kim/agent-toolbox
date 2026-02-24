# Testing Workflow Guide

Defines the workflow for generating tests, especially for complex components or directories with multiple files.

## Scope Clarification

| Scope | Rule |
|-------|------|
| **Single file** | Complete coverage in one generation (100% function, >95% branch) |
| **Multi-file directory** | Process one file at a time, verify each before proceeding |

## Critical Rule: Incremental Approach for Multi-File Testing

When testing a **directory with multiple files**, **NEVER generate all test files at once.** Use an incremental, verify-as-you-go approach.

### Why Incremental?

| Batch Approach | Incremental Approach |
|---------------|----------------------|
| Generate 5+ tests at once | Generate 1 test at a time |
| Run tests only at the end | Run test immediately after each |
| Multiple failures compound | Single point of failure, easy to debug |
| Mock issues affect many files | Mock issues caught early |

## Single File Workflow

When testing a **single component, hook, or utility**:

1. Read source code completely
2. Assess complexity and features
3. Write the test file
4. Run test
5. Fix any failures
6. Verify coverage meets goals (100% function, >95% branch)

## Directory/Multi-File Workflow

### Step 1: Analyze and Plan

1. **List all files** that need tests in the directory
2. **Categorize by complexity**:
   - Simple: Utility functions, simple hooks, presentational components
   - Medium: Components with state, effects, or event handlers
   - Complex: Components with API calls, routing, or many dependencies
3. **Order by dependency**: Test dependencies before dependents
4. **Create a todo list** to track progress

### Step 2: Determine Processing Order

```
1. Utility functions (simplest, no React)
2. Custom hooks (isolated logic)
3. Simple presentational components (few/no props)
4. Medium complexity components (state, effects)
5. Complex components (API, routing, many deps)
6. Container/index components (integration tests - last)
```

**Rationale**: Simpler files establish mock patterns. Hooks used by components should be tested first. Integration tests depend on child components working.

### Step 3: Process Each File Incrementally

**For EACH file in the ordered list:**

```
  1. Write test file
  2. Run test
  3. If FAIL -> Fix immediately, re-run
  4. If PASS -> Mark complete in todo list
  5. ONLY THEN proceed to next file
```

**DO NOT proceed to the next file until the current one passes.**

### Step 4: Final Verification

After all individual tests pass:

```bash
# Run all tests in the directory together
npx vitest path/to/directory/

# Check coverage
npx vitest --coverage path/to/directory/
```

## Component Complexity Guidelines

### Very Complex Components (Complexity > 50)

**Consider refactoring BEFORE testing:**

- Break component into smaller, testable pieces
- Extract complex logic into custom hooks
- Separate container and presentational layers

### Medium Complexity (30-50)

- Group related tests in `describe` blocks
- Test integration scenarios between internal parts
- Focus on state transitions and side effects

### Simple Components (< 30)

- Standard test structure
- Focus on props, rendering, and edge cases

### Large Files (500+ lines)

Regardless of complexity score:

- **Strongly consider refactoring** before testing
- If testing as-is, test major sections separately
- Create helper functions for test setup

## Todo List Format

When testing multiple files, use a todo list like this:

```
Testing: path/to/directory/

Ordered by complexity (simple -> complex):

[ ] utils/helper.ts           [utility, simple]
[ ] hooks/use-custom-hook.ts  [hook, simple]
[ ] empty-state.tsx           [component, simple]
[ ] item-card.tsx             [component, medium]
[ ] list.tsx                  [component, complex]
[ ] index.tsx                 [integration]

Progress: 0/6 complete
```

## When to Stop and Verify

**Always run tests after:**

- Completing a test file
- Making changes to fix a failure
- Modifying shared mocks
- Updating test utilities or helpers

**Signs you should pause:**

- More than 2 consecutive test failures
- Mock-related errors appearing
- Unclear why a test is failing
- Test passing but coverage unexpectedly low

## Common Pitfalls to Avoid

### Don't: Generate Everything First

```
# BAD: Writing all files then testing
Write component-a.spec.tsx
Write component-b.spec.tsx
Write component-c.spec.tsx
Run tests  <- Multiple failures, hard to debug
```

### Do: Verify Each Step

```
# GOOD: Incremental with verification
Write component-a.spec.tsx
Run test component-a.spec.tsx  PASS
Write component-b.spec.tsx
Run test component-b.spec.tsx  PASS
...continue...
```

### Don't: Skip Verification for "Simple" Components

Even simple components can have import errors, missing mock setup, or incorrect prop assumptions. **Always verify.**

### Don't: Continue When Tests Fail

Failing tests compound. A mock issue in file A affects files B, C, D. **Fix failures immediately.**
