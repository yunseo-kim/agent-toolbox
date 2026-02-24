# Mocking Guide for Frontend Tests

## What NOT to Mock

### DO NOT Mock Base UI Components

**Never mock components from your base/shared component library** such as:

- `Loading`, `Spinner`
- `Button`, `Input`, `Select`
- `Tooltip`, `Modal`, `Dropdown`
- `Icon`, `Badge`, `Tag`

**Why?**

- Base components should have their own dedicated tests
- Mocking them creates false positives (tests pass but real integration fails)
- Using real components tests actual integration behavior

```typescript
// WRONG: Don't mock base components
vi.mock('@/components/ui/loading', () => () => <div>Loading</div>)
vi.mock('@/components/ui/button', () => ({ children }: any) => <button>{children}</button>)

// CORRECT: Import and use real base components
import Loading from '@/components/ui/loading'
import Button from '@/components/ui/button'
// They will render normally in tests
```

### What TO Mock

Only mock these categories:

1. **API services** (`@/service/*`, `@/api/*`) -- Network calls
2. **Complex context providers** -- When setup is too difficult
3. **Third-party libraries with side effects** -- `next/navigation`, external SDKs
4. **i18n** -- Mock to return keys for deterministic testing

## Mock Placement

| Location | Purpose |
|----------|---------|
| `vitest.setup.ts` | Global mocks shared by all tests (i18n, image loaders) |
| `__mocks__/` | Reusable mock factories shared across multiple test files |
| Test file | Test-specific mocks, inline with `vi.mock()` |

## Essential Mocks

### 1. i18n

Set up a global mock in `vitest.setup.ts`:

```typescript
// vitest.setup.ts
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))
```

For custom translations in specific tests:

```typescript
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'button.save': 'Save',
        'my.custom.key': 'Custom translation',
      }
      return translations[key] ?? key
    },
  }),
}))
```

### 2. Next.js Router

```typescript
const mockPush = vi.fn()
const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/current-path',
  useSearchParams: () => new URLSearchParams('?key=value'),
}))

describe('Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should navigate on click', () => {
    render(<Component />)
    fireEvent.click(screen.getByRole('button'))
    expect(mockPush).toHaveBeenCalledWith('/expected-path')
  })
})
```

### 3. Portal Components (with Shared State)

```typescript
let mockPortalOpenState = false

vi.mock('@/components/ui/portal', () => ({
  Portal: ({ children, open }: any) => {
    mockPortalOpenState = open || false
    return <div data-testid="portal" data-open={open}>{children}</div>
  },
  PortalContent: ({ children }: any) => {
    if (!mockPortalOpenState) return null
    return <div data-testid="portal-content">{children}</div>
  },
  PortalTrigger: ({ children }: any) => (
    <div data-testid="portal-trigger">{children}</div>
  ),
}))

describe('Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPortalOpenState = false  // Reset shared state
  })
})
```

### 4. API Service Mocks

```typescript
import * as api from '@/service/api'

vi.mock('@/service/api')

const mockedApi = vi.mocked(api)

describe('Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedApi.fetchData.mockResolvedValue({ data: [] })
  })

  it('should show data on success', async () => {
    mockedApi.fetchData.mockResolvedValue({ data: [{ id: 1 }] })
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })
})
```

### 5. HTTP Mocking with Nock

```typescript
import nock from 'nock'

const mockGithubApi = (status: number, body: Record<string, unknown>) => {
  return nock('https://api.github.com')
    .get('/repos/owner/repo')
    .reply(status, body)
}

describe('GithubComponent', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('should display repo info', async () => {
    mockGithubApi(200, { name: 'my-repo', stars: 1000 })
    render(<GithubComponent />)

    await waitFor(() => {
      expect(screen.getByText('my-repo')).toBeInTheDocument()
    })
  })
})
```

### 6. Context Providers

```typescript
const createMockContext = (overrides = {}) => ({
  user: { id: '1', name: 'Test User' },
  isAuthenticated: true,
  ...overrides,
})

describe('Component with Context', () => {
  it('should render for authenticated user', () => {
    const mockContext = createMockContext()

    render(
      <AppContext.Provider value={mockContext}>
        <Component />
      </AppContext.Provider>
    )

    expect(screen.queryByText('Login')).not.toBeInTheDocument()
  })

  it('should show login for unauthenticated user', () => {
    const mockContext = createMockContext({ isAuthenticated: false })

    render(
      <AppContext.Provider value={mockContext}>
        <Component />
      </AppContext.Provider>
    )

    expect(screen.getByText('Login')).toBeInTheDocument()
  })
})
```

### 7. React Query

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}
```

## Zustand Store Testing

### Recommended: Use Real Stores

**DO NOT mock store modules manually.** Import the real store, then use `setState()` to set test state:

```typescript
import { useAppStore } from '@/stores/app'

describe('MyComponent', () => {
  it('should render app details', () => {
    useAppStore.setState({
      appDetail: { id: 'test-app', name: 'Test App', mode: 'chat' },
    })

    render(<MyComponent />)
    expect(screen.getByText('Test App')).toBeInTheDocument()
  })
})
```

### Global Zustand Mock Setup

Follow the [official Zustand testing guide](https://zustand.docs.pmnd.rs/guides/testing) to set up auto-resetting stores. Create `__mocks__/zustand.ts` that provides:

- Real store behavior with `getState()`, `setState()`, `subscribe()` methods
- Automatic store reset after each test via `afterEach`

### Store Testing Decision Tree

```
Need to test a component using Zustand store?
|
+- Can you use the real store?
|  +- YES -> Use real store + setState (RECOMMENDED)
|
+- Does the store have complex initialization?
|  +- YES -> Consider mocking, but include full API
|
+- Are you testing the store itself?
   +- YES -> Test store directly with getState/setState
```

## Mock Best Practices

### DO

1. **Use real base components** -- Import from your UI library directly
2. **Use real project components** -- Prefer importing over mocking
3. **Use real Zustand stores** -- Set test state via `store.setState()`
4. **Reset mocks in `beforeEach`**, not `afterEach`
5. **Match actual component behavior** in mocks
6. **Use factory functions** for complex mock data
7. **Import actual types** for type safety

### DON'T

1. **Don't mock base UI components** (`Loading`, `Button`, `Tooltip`, etc.)
2. **Don't mock Zustand store modules** -- Use real stores with `setState()`
3. Don't create overly simplified mocks that miss conditional logic
4. Don't forget to clean up nock after each test
5. Don't use `any` types in mocks without necessity

## Factory Function Pattern

```typescript
// __mocks__/data-factories.ts
import type { User, Project } from '@/types'

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'member',
  createdAt: new Date().toISOString(),
  ...overrides,
})

export const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-1',
  name: 'Test Project',
  description: 'A test project',
  owner: createMockUser(),
  members: [],
  createdAt: new Date().toISOString(),
  ...overrides,
})

// Usage in tests
it('should display project owner', () => {
  const project = createMockProject({
    owner: createMockUser({ name: 'John Doe' }),
  })

  render(<ProjectCard project={project} />)
  expect(screen.getByText('John Doe')).toBeInTheDocument()
})
```
