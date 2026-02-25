---
name: frontend-testing
description: >
  Generate comprehensive Vitest and React Testing Library tests for frontend
  components, hooks, and utilities. Covers test structure, incremental workflow,
  async patterns, mocking strategies, and coverage goals. Use when writing or
  reviewing frontend tests, improving coverage, or setting up testing
  infrastructure for React projects.
license: Sustainable Use License 1.0

metadata:
  domain: devops
  subdomain: testing
  tags: "vitest, react-testing-library, unit-testing, integration-testing, frontend, mocking"
  frameworks: "react, nextjs, vitest"
  author: "Yunseo Kim <dev@yunseo.kim>"
  lastUpdated: "12026-02-25"
  provenance: adapted
---

# Frontend Testing

Generate high-quality, comprehensive frontend tests following established conventions and best practices.

## When to Apply

Apply this skill when:

- Writing **tests** for a component, hook, or utility
- Reviewing **existing tests** for completeness
- Working with **Vitest**, **React Testing Library**, or **spec files**
- Improving **test coverage**
- Writing **unit tests** or **integration tests** for frontend code

**Do NOT apply** when:

- Testing backend/API code (Python/pytest, Go, etc.)
- Writing E2E tests (Playwright/Cypress)
- Answering conceptual questions without code context

## Quick Reference

### Tech Stack

| Tool | Purpose |
|------|---------|
| Vitest | Test runner |
| React Testing Library | Component testing |
| jsdom | Test environment |
| nock | HTTP mocking |
| TypeScript | Type safety |

### Key Commands

```bash
# Run all tests
npm test            # or: pnpm test / yarn test

# Watch mode
npm run test:watch

# Run specific file
npx vitest path/to/file.spec.tsx

# Generate coverage report
npx vitest --coverage
```

### File Naming

- Test files: `ComponentName.spec.tsx` (same directory as component)
- Integration tests: `__tests__/` directory

## Test Structure Template

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Component from './index'

// Mock external dependencies only
vi.mock('@/service/api')
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/test',
}))

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Rendering tests (REQUIRED)
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<Component title="Test" />)
      expect(screen.getByText('Test')).toBeInTheDocument()
    })
  })

  // Props tests (REQUIRED)
  describe('Props', () => {
    it('should apply custom className', () => {
      render(<Component className="custom" />)
      expect(screen.getByRole('button')).toHaveClass('custom')
    })
  })

  // User Interactions
  describe('User Interactions', () => {
    it('should handle click events', () => {
      const handleClick = vi.fn()
      render(<Component onClick={handleClick} />)
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  // Edge Cases (REQUIRED)
  describe('Edge Cases', () => {
    it('should handle null data', () => {
      render(<Component data={null} />)
      expect(screen.getByText(/no data/i)).toBeInTheDocument()
    })

    it('should handle empty array', () => {
      render(<Component items={[]} />)
      expect(screen.getByText(/empty/i)).toBeInTheDocument()
    })
  })
})
```

## Testing Workflow

### Incremental Approach (Required for Multi-File)

**NEVER generate all test files at once.** For complex components or multi-file directories:

1. **Analyze & Plan**: List all files, order by complexity (simple to complex)
2. **Process ONE at a time**: Write test, run test, fix if needed, then next
3. **Verify before proceeding**: Do NOT continue to next file until current passes

```
For each file:
  1. Write test
  2. Run: npx vitest <file>.spec.tsx
  3. PASS? -> Mark complete, next file
     FAIL? -> Fix first, then continue
```

### Complexity-Based Order

Process in this order for multi-file testing:

1. Utility functions (simplest)
2. Custom hooks
3. Simple components (presentational)
4. Medium components (state, effects)
5. Complex components (API, routing)
6. Integration tests (index files -- last)

### When to Refactor First

- **Complexity > 50**: Break into smaller pieces before testing
- **500+ lines**: Consider splitting before testing
- **Many dependencies**: Extract logic into hooks first

## Testing Strategy

### Integration Testing First

**Prefer integration testing** when writing tests for a directory:

- Import **real project components** directly (including base components and siblings)
- **Only mock**: API services, `next/navigation`, complex context providers
- **DO NOT mock** base UI components (`Button`, `Input`, `Loading`, etc.)
- **DO NOT mock** sibling/child components in the same directory

### Path-Level Testing

When assigned to test a directory/path, test **ALL content** within that path:

- Test all components, hooks, utilities in the directory
- Use incremental approach: one file at a time, verify each before proceeding
- Goal: full coverage of all files in the directory

## Core Principles

### 1. AAA Pattern (Arrange-Act-Assert)

Every test should clearly separate:

- **Arrange**: Setup test data and render component
- **Act**: Perform user actions
- **Assert**: Verify expected outcomes

### 2. Black-Box Testing

- Test observable behavior, not implementation details
- Use semantic queries (`getByRole`, `getByLabelText`)
- Avoid testing internal state directly
- Prefer pattern matching over hardcoded strings:

```typescript
// Prefer role-based queries
expect(screen.getByRole('status')).toBeInTheDocument()

// Prefer pattern matching
expect(screen.getByText(/loading/i)).toBeInTheDocument()
```

### 3. Single Behavior Per Test

Each test verifies ONE user-observable behavior:

```typescript
// Good: One behavior
it('should disable button when loading', () => {
  render(<Button loading />)
  expect(screen.getByRole('button')).toBeDisabled()
})

// Bad: Multiple behaviors
it('should handle loading state', () => {
  render(<Button loading />)
  expect(screen.getByRole('button')).toBeDisabled()
  expect(screen.getByText('Loading...')).toBeInTheDocument()
  expect(screen.getByRole('button')).toHaveClass('loading')
})
```

### 4. Semantic Naming

Use `should <behavior> when <condition>`:

```typescript
it('should show error message when validation fails')
it('should call onSubmit when form is valid')
it('should disable input when isReadOnly is true')
```

## Required Test Scenarios

### Always Required (All Components)

1. **Rendering**: Component renders without crashing
2. **Props**: Required props, optional props, default values
3. **Edge Cases**: null, undefined, empty values, boundary conditions

### Conditional (When Present)

| Feature | Test Focus |
|---------|-----------|
| `useState` | Initial state, transitions, cleanup |
| `useEffect` | Execution, dependencies, cleanup |
| Event handlers | All onClick, onChange, onSubmit, keyboard |
| API calls | Loading, success, error states |
| Routing | Navigation, params, query strings |
| `useCallback`/`useMemo` | Referential equality |
| Context | Provider values, consumer behavior |
| Forms | Validation, submission, error display |

## Coverage Goals (Per File)

- 100% function coverage
- 100% statement coverage
- \>95% branch coverage
- \>95% line coverage

## References

- `references/async-testing.md` - Async operations, fake timers, and API testing patterns
- `references/checklist.md` - Test generation checklist and validation steps
- `references/common-patterns.md` - Query priority, event handling, forms, modals, lists
- `references/mocking.md` - Mock patterns, Zustand stores, factory functions
- `references/workflow.md` - Incremental testing workflow for multi-file directories
- `assets/component-test.template.tsx` - Component test template
- `assets/hook-test.template.ts` - Hook test template
- `assets/utility-test.template.ts` - Utility function test template
