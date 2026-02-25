---
name: react-refactoring
description: >
  Refactor high-complexity React components using proven patterns for hook
  extraction, component splitting, conditional simplification, and API/data
  layer separation. Use when components exceed 300 lines, have deep nesting,
  mix business logic with UI, or manage too many state variables. Avoid for
  simple or well-structured components.
license: Sustainable Use License 1.0

metadata:
  domain: development
  subdomain: frontend
  tags: "react, refactoring, hooks, components, code-splitting, complexity-reduction"
  frameworks: "react, nextjs"
  author: "Yunseo Kim <dev@yunseo.kim>"
  lastUpdated: "12026-02-25"
  provenance: adapted
---

# React Component Refactoring

Refactor high-complexity React components using the patterns and workflow below.

## Quick Reference

### Complexity Score Interpretation

| Score | Level | Action |
|-------|-------|--------|
| 0-25 | Simple | Ready for testing |
| 26-50 | Medium | Consider minor refactoring |
| 51-75 | Complex | **Refactor before testing** |
| 76-100 | Very Complex | **Must refactor** |

> Use any complexity analysis tool (SonarQube, ESLint complexity rules, or manual assessment) to gauge component complexity. Components with complexity > 50 or line count > 300 are prime refactoring candidates.

## Core Refactoring Patterns

### Pattern 1: Extract Custom Hooks

**When**: Component has complex state management, multiple `useState`/`useEffect`, or business logic mixed with UI.

**Convention**: Place hooks in a `hooks/` subdirectory or alongside the component as `use-<feature>.ts`.

```typescript
// Before: Complex state logic in component
const Configuration: FC = () => {
  const [modelConfig, setModelConfig] = useState<ModelConfig>(...)
  const [datasetConfigs, setDatasetConfigs] = useState<DatasetConfigs>(...)
  const [completionParams, setCompletionParams] = useState<FormValue>({})

  // 50+ lines of state management logic...

  return <div>...</div>
}

// After: Extract to custom hook
// hooks/use-model-config.ts
export const useModelConfig = (id: string) => {
  const [modelConfig, setModelConfig] = useState<ModelConfig>(...)
  const [completionParams, setCompletionParams] = useState<FormValue>({})

  // Related state management logic here

  return { modelConfig, setModelConfig, completionParams, setCompletionParams }
}

// Component becomes cleaner
const Configuration: FC = () => {
  const { modelConfig, setModelConfig } = useModelConfig(id)
  return <div>...</div>
}
```

### Pattern 2: Extract Sub-Components

**When**: Single component has multiple UI sections, conditional rendering blocks, or repeated patterns.

**Convention**: Place sub-components in subdirectories or as separate files in the same directory.

```typescript
// Before: Monolithic JSX with multiple sections
const AppInfo = () => {
  return (
    <div>
      {/* 100 lines of header UI */}
      {/* 100 lines of operations UI */}
      {/* 100 lines of modals */}
    </div>
  )
}

// After: Split into focused components
// app-info/
//   index.tsx           (orchestration only)
//   app-header.tsx      (header UI)
//   app-operations.tsx  (operations UI)
//   app-modals.tsx      (modal management)

const AppInfo = () => {
  const { showModal, setShowModal } = useAppInfoModals()

  return (
    <div>
      <AppHeader appDetail={appDetail} />
      <AppOperations onAction={handleAction} />
      <AppModals show={showModal} onClose={() => setShowModal(null)} />
    </div>
  )
}
```

### Pattern 3: Simplify Conditional Logic

**When**: Deep nesting (> 3 levels), complex ternaries, or multiple `if/else` chains.

```typescript
// Before: Deeply nested conditionals
const Template = useMemo(() => {
  if (mode === Mode.CHAT) {
    switch (locale) {
      case 'zh': return <TemplateChatZh />
      case 'ja': return <TemplateChatJa />
      default:   return <TemplateChatEn />
    }
  }
  if (mode === Mode.ADVANCED) {
    // Another 15 lines...
  }
  // More conditions...
}, [mode, locale])

// After: Use lookup tables + early returns
const TEMPLATE_MAP = {
  [Mode.CHAT]: {
    zh: TemplateChatZh,
    ja: TemplateChatJa,
    default: TemplateChatEn,
  },
  [Mode.ADVANCED]: {
    zh: TemplateAdvancedZh,
    default: TemplateAdvancedEn,
  },
}

const Template = useMemo(() => {
  const modeTemplates = TEMPLATE_MAP[mode]
  if (!modeTemplates) return null

  const TemplateComponent = modeTemplates[locale] || modeTemplates.default
  return <TemplateComponent />
}, [mode, locale])
```

### Pattern 4: Extract API/Data Logic

**When**: Component directly handles API calls, data transformation, or complex async operations.

**Convention**: Use React Query hooks or custom data hooks to separate fetching from rendering.

```typescript
// Before: API logic in component
const ServiceCard = () => {
  const [config, setConfig] = useState({})

  useEffect(() => {
    if (isActive && id) {
      (async () => {
        const res = await fetchDetail({ url: '/items', id })
        setConfig(res?.config || {})
      })()
    }
  }, [id, isActive])
}

// After: Extract to data hook using React Query
// use-item-config.ts
export const useItemConfig = (id: string, enabled: boolean) => {
  return useQuery({
    enabled: enabled && !!id,
    queryKey: ['itemConfig', 'detail', id],
    queryFn: () => get<ItemDetailResponse>(`/items/${id}`),
    select: data => data?.config || {},
  })
}

// Component becomes cleaner
const ServiceCard = () => {
  const { data: config, isLoading } = useItemConfig(id, isActive)
  // UI only
}
```

### Pattern 5: Extract Modal/Dialog Management

**When**: Component manages multiple modals with complex open/close states.

```typescript
// Before: Multiple modal states in component
const AppInfo = () => {
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showSwitchModal, setShowSwitchModal] = useState(false)
  // 5+ more modal states...
}

// After: Extract to modal management hook
type ModalType = 'edit' | 'duplicate' | 'delete' | 'switch' | null

const useModalState = () => {
  const [activeModal, setActiveModal] = useState<ModalType>(null)

  const openModal = useCallback((type: ModalType) => setActiveModal(type), [])
  const closeModal = useCallback(() => setActiveModal(null), [])

  return {
    activeModal,
    openModal,
    closeModal,
    isOpen: (type: ModalType) => activeModal === type,
  }
}
```

### Pattern 6: Extract Form Logic

**When**: Complex form validation, submission handling, or field transformation.

**Convention**: Use a form library (`@tanstack/react-form`, `react-hook-form`) or extract to a custom hook.

```typescript
// After: Extract to form hook
const useConfigForm = (initialValues: ConfigFormValues) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {}
    if (!values.name) newErrors.name = 'Name is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [values])

  const handleSubmit = useCallback(
    async (onSubmit: (values: ConfigFormValues) => Promise<void>) => {
      if (!validate()) return
      setIsSubmitting(true)
      try { await onSubmit(values) } finally { setIsSubmitting(false) }
    },
    [values, validate],
  )

  return { values, errors, isSubmitting, handleChange: setValues, handleSubmit }
}
```

## Refactoring Workflow

### Step 1: Assess Complexity

Identify:
- Total complexity score (target < 50)
- Max function complexity (target < 30)
- Line count (target < 300)
- Features detected (state, effects, API calls, modals, forms)

### Step 2: Plan

Create a refactoring plan based on detected features:

| Detected Feature | Refactoring Action |
|------------------|-------------------|
| Multiple `useState` + `useEffect` | Extract custom hook |
| API calls in component | Extract data/service hook |
| Many event handlers | Extract event handler logic |
| 300+ lines | Split into sub-components |
| Deep nesting / complex conditionals | Simplify conditional logic |
| Multiple modal states | Extract modal management |

### Step 3: Execute Incrementally

1. **Extract one piece at a time**
2. **Run lint, type-check, and tests after each extraction**
3. **Verify functionality before next step**

```
For each extraction:
  1. Extract code
  2. Run lint and type-check
  3. Run tests
  4. Test functionality manually
  5. PASS? -> Next extraction
     FAIL? -> Fix before continuing
```

### Step 4: Verify

After refactoring, confirm:
- Complexity < 50 and lines < 300
- All tests still pass
- No new type errors
- Functionality unchanged

## Common Mistakes to Avoid

### Over-Engineering

```typescript
// Too many tiny hooks
const useButtonText = () => useState('Click')
const useButtonDisabled = () => useState(false)

// Cohesive hook with related state
const useButtonState = () => {
  const [text, setText] = useState('Click')
  const [disabled, setDisabled] = useState(false)
  const [loading, setLoading] = useState(false)
  return { text, setText, disabled, setDisabled, loading, setLoading }
}
```

### Breaking Existing Patterns

- Follow existing directory structures in your project
- Maintain naming conventions
- Preserve export patterns for compatibility

### Premature Abstraction

- Only extract when there's clear complexity benefit
- Don't create abstractions for single-use code
- Keep refactored code in the same domain area

## References

- `references/complexity-patterns.md` - Detailed complexity reduction patterns
- `references/component-splitting.md` - Component splitting strategies and directory structures
- `references/hook-extraction.md` - Hook extraction process and common hook patterns
