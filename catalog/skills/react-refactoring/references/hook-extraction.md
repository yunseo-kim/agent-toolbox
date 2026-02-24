# Hook Extraction Patterns

Detailed guidance on extracting custom hooks from complex components.

## When to Extract Hooks

Extract a custom hook when you identify:

1. **Coupled state groups** - Multiple `useState` hooks that are always used together
2. **Complex effects** - `useEffect` with multiple dependencies or cleanup logic
3. **Business logic** - Data transformations, validations, or calculations
4. **Reusable patterns** - Logic that appears in multiple components

## Extraction Process

### Step 1: Identify State Groups

Look for state variables that are logically related:

```typescript
// These belong together - extract to hook
const [modelConfig, setModelConfig] = useState<ModelConfig>(...)
const [completionParams, setCompletionParams] = useState<FormValue>({})
const [modelMode, setModelMode] = useState<ModelMode>(...)

// These are model-related state that should be in useModelConfig()
```

### Step 2: Identify Related Effects

Find effects that modify the grouped state:

```typescript
// This effect belongs with the state above
useEffect(() => {
  if (hasFetchedDetail && !modelMode) {
    const mode = currModel?.properties?.mode
    if (mode) {
      setModelConfig(produce(modelConfig, draft => { draft.mode = mode }))
    }
  }
}, [modelList, hasFetchedDetail, modelMode, currModel])
```

### Step 3: Create the Hook

```typescript
// hooks/use-model-config.ts
interface UseModelConfigParams {
  initialConfig?: Partial<ModelConfig>
  currModel?: { properties?: { mode?: ModelMode } }
  hasFetchedDetail: boolean
}

interface UseModelConfigReturn {
  modelConfig: ModelConfig
  setModelConfig: (config: ModelConfig) => void
  completionParams: FormValue
  setCompletionParams: (params: FormValue) => void
  modelMode: ModelMode
}

export const useModelConfig = ({
  initialConfig,
  currModel,
  hasFetchedDetail,
}: UseModelConfigParams): UseModelConfigReturn => {
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    provider: 'openai',
    model_id: 'gpt-3.5-turbo',
    mode: ModelMode.unset,
    ...initialConfig,
  })

  const [completionParams, setCompletionParams] = useState<FormValue>({})
  const modelMode = modelConfig.mode

  useEffect(() => {
    if (hasFetchedDetail && !modelMode) {
      const mode = currModel?.properties?.mode
      if (mode) {
        setModelConfig(produce(modelConfig, draft => { draft.mode = mode }))
      }
    }
  }, [hasFetchedDetail, modelMode, currModel])

  return { modelConfig, setModelConfig, completionParams, setCompletionParams, modelMode }
}
```

### Step 4: Update Component

```typescript
// Before: 50+ lines of state management
const Configuration: FC = () => {
  const [modelConfig, setModelConfig] = useState<ModelConfig>(...)
  // ... lots of related state and effects
}

// After: Clean component
const Configuration: FC = () => {
  const {
    modelConfig, setModelConfig,
    completionParams, setCompletionParams,
    modelMode,
  } = useModelConfig({ currModel, hasFetchedDetail })

  // Component now focuses on UI
}
```

## Naming Conventions

### Hook Names

- Use `use` prefix: `useModelConfig`, `useDatasetConfig`
- Be specific: `useAdvancedPromptConfig` not `usePrompt`
- Include domain: `useWorkflowVariables`, `useServerConfig`

### File Names

- Kebab-case: `use-model-config.ts`
- Place in `hooks/` subdirectory when multiple hooks exist
- Place alongside component for single-use hooks

### Return Type Names

- Suffix with `Return`: `UseModelConfigReturn`
- Suffix params with `Params`: `UseModelConfigParams`

## Common Hook Patterns

### 1. Data Fetching Hook (React Query)

```typescript
import { useQuery, useQueryClient } from '@tanstack/react-query'

const useItemConfig = (itemId: string) => {
  return useQuery({
    enabled: !!itemId,
    queryKey: ['itemConfig', 'detail', itemId],
    queryFn: () => get<ItemDetailResponse>(`/items/${itemId}`),
    select: data => data?.config || null,
  })
}

// Invalidation hook for refreshing data
const useInvalidItemConfig = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['itemConfig'] })
}

// Usage in component
const Component = () => {
  const { data: config, isLoading, error, refetch } = useItemConfig(itemId)
  const invalidItemConfig = useInvalidItemConfig()

  const handleRefresh = () => invalidItemConfig()
  return <div>...</div>
}
```

### 2. Form State Hook

```typescript
export const useConfigForm = (initialValues: ConfigFormValues) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {}
    if (!values.name) newErrors.name = 'Name is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [values])

  const handleChange = useCallback((field: string, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSubmit = useCallback(
    async (onSubmit: (values: ConfigFormValues) => Promise<void>) => {
      if (!validate()) return
      setIsSubmitting(true)
      try { await onSubmit(values) } finally { setIsSubmitting(false) }
    },
    [values, validate],
  )

  return { values, errors, isSubmitting, handleChange, handleSubmit }
}
```

### 3. Modal State Hook

```typescript
type ModalType = 'edit' | 'delete' | 'duplicate' | null

export const useModalState = () => {
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [modalData, setModalData] = useState<any>(null)

  const openModal = useCallback((type: ModalType, data?: any) => {
    setActiveModal(type)
    setModalData(data)
  }, [])

  const closeModal = useCallback(() => {
    setActiveModal(null)
    setModalData(null)
  }, [])

  return {
    activeModal,
    modalData,
    openModal,
    closeModal,
    isOpen: useCallback((type: ModalType) => activeModal === type, [activeModal]),
  }
}
```

### 4. Toggle/Boolean Hook

```typescript
export const useToggle = (initialValue = false) => {
  const [value, setValue] = useState(initialValue)

  const toggle = useCallback(() => setValue(v => !v), [])
  const setTrue = useCallback(() => setValue(true), [])
  const setFalse = useCallback(() => setValue(false), [])

  return [value, { toggle, setTrue, setFalse, set: setValue }] as const
}

// Usage
const [isExpanded, { toggle, setTrue: expand, setFalse: collapse }] = useToggle()
```

## Testing Extracted Hooks

After extraction, test hooks in isolation:

```typescript
import { renderHook, act } from '@testing-library/react'
import { useModelConfig } from './use-model-config'

describe('useModelConfig', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() =>
      useModelConfig({ hasFetchedDetail: false }),
    )
    expect(result.current.modelConfig.provider).toBe('openai')
    expect(result.current.modelMode).toBe(ModelMode.unset)
  })

  it('should update model config', () => {
    const { result } = renderHook(() =>
      useModelConfig({ hasFetchedDetail: true }),
    )
    act(() => {
      result.current.setModelConfig({
        ...result.current.modelConfig,
        model_id: 'gpt-4',
      })
    })
    expect(result.current.modelConfig.model_id).toBe('gpt-4')
  })
})
```
