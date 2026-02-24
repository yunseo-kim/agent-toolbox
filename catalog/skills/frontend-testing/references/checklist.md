# Test Generation Checklist

Use this checklist when generating or reviewing tests for frontend components.

## Pre-Generation

- [ ] Read the component source code completely
- [ ] Identify component type (component, hook, utility, page)
- [ ] Note complexity and features detected
- [ ] Check for existing tests in the same directory
- [ ] **Identify ALL files in the directory** that need testing (not just index)

## Testing Strategy

### Incremental Workflow (Critical for Multi-File)

- [ ] **NEVER generate all tests at once** - process one file at a time
- [ ] Order files by complexity: utilities, hooks, simple, complex, integration
- [ ] Create a todo list to track progress before starting
- [ ] For EACH file: write, run test, verify pass, then next
- [ ] **DO NOT proceed** to next file until current one passes

### Path-Level Coverage

- [ ] **Test ALL files** in the assigned directory/path
- [ ] List all components, hooks, utilities that need coverage
- [ ] Decide: single spec file (integration) or multiple spec files (unit)

### Complexity Assessment

- [ ] **Complexity > 50**: Consider refactoring before testing
- [ ] **500+ lines**: Consider splitting before testing
- [ ] **30-50 complexity**: Use multiple describe blocks, organized structure

### Integration vs Mocking

- [ ] **DO NOT mock base components** (`Loading`, `Button`, `Tooltip`, etc.)
- [ ] Import real project components instead of mocking
- [ ] Only mock: API calls, complex context providers, third-party libs with side effects
- [ ] Prefer integration testing when using single spec file

## Required Test Sections

### All Components MUST Have

- [ ] **Rendering tests** - Component renders without crashing
- [ ] **Props tests** - Required props, optional props, default values
- [ ] **Edge cases** - null, undefined, empty values, boundaries

### Conditional Sections (Add When Feature Present)

| Feature | Add Tests For |
|---------|---------------|
| `useState` | Initial state, transitions, cleanup |
| `useEffect` | Execution, dependencies, cleanup |
| Event handlers | onClick, onChange, onSubmit, keyboard |
| API calls | Loading, success, error states |
| Routing | Navigation, params, query strings |
| `useCallback`/`useMemo` | Referential equality |
| Context | Provider values, consumer behavior |
| Forms | Validation, submission, error display |

## Code Quality Checklist

### Structure

- [ ] Uses `describe` blocks to group related tests
- [ ] Test names follow `should <behavior> when <condition>` pattern
- [ ] AAA pattern (Arrange-Act-Assert) is clear
- [ ] Comments explain complex test scenarios

### Mocks

- [ ] **DO NOT mock base UI components**
- [ ] `vi.clearAllMocks()` in `beforeEach` (not `afterEach`)
- [ ] Shared mock state reset in `beforeEach`
- [ ] Router mocks match actual Next.js API
- [ ] Mocks reflect actual component conditional behavior
- [ ] Only mock: API services, complex context providers, third-party libs

### Queries

- [ ] Prefer semantic queries (`getByRole`, `getByLabelText`)
- [ ] Use `queryBy*` for absence assertions
- [ ] Use `findBy*` for async elements
- [ ] `getByTestId` only as last resort

### Async

- [ ] All async tests use `async/await`
- [ ] `waitFor` wraps async assertions
- [ ] Fake timers properly setup/teardown
- [ ] No floating promises

### TypeScript

- [ ] No `any` types without justification
- [ ] Mock data uses actual types from source
- [ ] Factory functions have proper return types

## Coverage Goals (Per File)

- [ ] 100% function coverage
- [ ] 100% statement coverage
- [ ] >95% branch coverage
- [ ] >95% line coverage

## Post-Generation (Per File)

**Run these checks after EACH test file, not just at the end:**

- [ ] Run test for specific file -- **MUST PASS before next file**
- [ ] Fix any failures immediately
- [ ] Mark file as complete in todo list
- [ ] Only then proceed to next file

### After All Files Complete

- [ ] Run full directory test
- [ ] Check coverage report
- [ ] Run linter on all test files
- [ ] Run type-check

## Common Issues to Watch

### False Positives

```typescript
// Bad: Mock doesn't match actual behavior
vi.mock('./Component', () => () => <div>Mocked</div>)

// Good: Mock matches actual conditional logic
vi.mock('./Component', () => ({ isOpen }: any) =>
  isOpen ? <div>Content</div> : null
)
```

### State Leakage

```typescript
// Bad: Shared state not reset
let mockState = false
vi.mock('./useHook', () => () => mockState)

// Good: Reset in beforeEach
beforeEach(() => {
  mockState = false
})
```

### Async Race Conditions

```typescript
// Bad: Not awaited
it('loads data', () => {
  render(<Component />)
  expect(screen.getByText('Data')).toBeInTheDocument()
})

// Good: Properly awaited
it('loads data', async () => {
  render(<Component />)
  await waitFor(() => {
    expect(screen.getByText('Data')).toBeInTheDocument()
  })
})
```

### Missing Edge Cases

Always test these scenarios:

- `null` / `undefined` inputs
- Empty strings / arrays / objects
- Boundary values (0, -1, MAX_INT)
- Error states
- Loading states
- Disabled states
