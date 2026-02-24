# Complexity Reduction Patterns

Patterns for reducing cognitive complexity in React components.

## Understanding Complexity

### Cognitive Complexity Metrics

Complexity analysis tools (SonarQube, ESLint) use cognitive complexity metrics:

- **Total Complexity**: Sum of all functions' complexity in the file
- **Max Complexity**: Highest single function complexity

### What Increases Complexity

| Pattern | Complexity Impact |
|---------|-------------------|
| `if/else` | +1 per branch |
| Nested conditions | +1 per nesting level |
| `switch/case` | +1 per case |
| `for/while/do` | +1 per loop |
| `&&`/`||` chains | +1 per operator |
| Nested callbacks | +1 per nesting level |
| `try/catch` | +1 per catch |
| Ternary expressions | +1 per nesting |

## Pattern 1: Replace Conditionals with Lookup Tables

**Before** (complexity: ~15):

```typescript
const Template = useMemo(() => {
  if (mode === Mode.CHAT) {
    switch (locale) {
      case 'zh': return <TemplateChatZh detail={detail} />
      case 'ja': return <TemplateChatJa detail={detail} />
      default:   return <TemplateChatEn detail={detail} />
    }
  }
  if (mode === Mode.ADVANCED) {
    switch (locale) {
      case 'zh': return <TemplateAdvancedZh detail={detail} />
      case 'ja': return <TemplateAdvancedJa detail={detail} />
      default:   return <TemplateAdvancedEn detail={detail} />
    }
  }
  return null
}, [mode, locale])
```

**After** (complexity: ~3):

```typescript
const TEMPLATE_MAP: Record<Mode, Record<string, FC<TemplateProps>>> = {
  [Mode.CHAT]: {
    zh: TemplateChatZh,
    ja: TemplateChatJa,
    default: TemplateChatEn,
  },
  [Mode.ADVANCED]: {
    zh: TemplateAdvancedZh,
    ja: TemplateAdvancedJa,
    default: TemplateAdvancedEn,
  },
}

const Template = useMemo(() => {
  if (!mode) return null
  const templates = TEMPLATE_MAP[mode]
  if (!templates) return null
  const TemplateComponent = templates[locale] ?? templates.default
  return <TemplateComponent detail={detail} />
}, [mode, locale])
```

## Pattern 2: Use Early Returns

**Before** (complexity: ~10):

```typescript
const handleSubmit = () => {
  if (isValid) {
    if (hasChanges) {
      if (isConnected) {
        submitData()
      } else {
        showConnectionError()
      }
    } else {
      showNoChangesMessage()
    }
  } else {
    showValidationError()
  }
}
```

**After** (complexity: ~4):

```typescript
const handleSubmit = () => {
  if (!isValid) {
    showValidationError()
    return
  }
  if (!hasChanges) {
    showNoChangesMessage()
    return
  }
  if (!isConnected) {
    showConnectionError()
    return
  }
  submitData()
}
```

## Pattern 3: Extract Complex Conditions

**Before** (complexity: high):

```typescript
const canPublish = (() => {
  if (mode !== Mode.COMPLETION) {
    if (!isAdvancedMode) return true
    if (modelMode === ModelMode.completion) {
      if (!hasSetHistory || !hasSetQuery) return false
      return true
    }
    return true
  }
  return !promptEmpty
})()
```

**After** (complexity: lower):

```typescript
const canPublishInCompletionMode = () => !promptEmpty

const canPublishInChatMode = () => {
  if (!isAdvancedMode) return true
  if (modelMode !== ModelMode.completion) return true
  return hasSetHistory && hasSetQuery
}

const canPublish = mode === Mode.COMPLETION
  ? canPublishInCompletionMode()
  : canPublishInChatMode()
```

## Pattern 4: Replace Chained Ternaries

**Before** (complexity: ~5):

```typescript
const statusText = serverActivated
  ? t('status.running')
  : serverPublished
    ? t('status.inactive')
    : appUnpublished
      ? t('status.unpublished')
      : t('status.notConfigured')
```

**After** (complexity: ~2):

```typescript
const getStatusText = () => {
  if (serverActivated) return t('status.running')
  if (serverPublished) return t('status.inactive')
  if (appUnpublished) return t('status.unpublished')
  return t('status.notConfigured')
}

const statusText = getStatusText()
```

Or use a lookup:

```typescript
const STATUS_KEY_MAP = {
  running: 'status.running',
  inactive: 'status.inactive',
  unpublished: 'status.unpublished',
  notConfigured: 'status.notConfigured',
} as const

const getStatusKey = (): keyof typeof STATUS_KEY_MAP => {
  if (serverActivated) return 'running'
  if (serverPublished) return 'inactive'
  if (appUnpublished) return 'unpublished'
  return 'notConfigured'
}

const statusText = t(STATUS_KEY_MAP[getStatusKey()])
```

## Pattern 5: Flatten Nested Loops

**Before** (complexity: high):

```typescript
const processData = (items: Item[]) => {
  const results: ProcessedItem[] = []
  for (const item of items) {
    if (item.isValid) {
      for (const child of item.children) {
        if (child.isActive) {
          for (const prop of child.properties) {
            if (prop.value !== null) {
              results.push({
                itemId: item.id,
                childId: child.id,
                propValue: prop.value,
              })
            }
          }
        }
      }
    }
  }
  return results
}
```

**After** (complexity: lower):

```typescript
const processData = (items: Item[]) => {
  return items
    .filter(item => item.isValid)
    .flatMap(item =>
      item.children
        .filter(child => child.isActive)
        .flatMap(child =>
          child.properties
            .filter(prop => prop.value !== null)
            .map(prop => ({
              itemId: item.id,
              childId: child.id,
              propValue: prop.value,
            }))
        )
    )
}
```

## Pattern 6: Extract Event Handler Logic

**Before** (complexity: high in component):

```typescript
const Component = () => {
  const handleSelect = (data: DataItem[]) => {
    if (isEqual(data.map(d => d.id), items.map(d => d.id))) {
      hideSelector()
      return
    }
    formattingChangedDispatcher()
    let newItems = data
    if (data.find(d => !d.name)) {
      const patched = produce(data, (draft) => {
        data.forEach((d, i) => {
          if (!d.name) {
            const existing = items.find(x => x.id === d.id)
            if (existing) draft[i] = existing
          }
        })
      })
      setItems(patched)
      newItems = patched
    } else {
      setItems(data)
    }
    hideSelector()
    // 40 more lines of logic...
  }
  return <div>...</div>
}
```

**After** (complexity: lower):

```typescript
const useItemSelection = (items: DataItem[], setItems: SetState<DataItem[]>) => {
  const normalizeSelection = (data: DataItem[]) => {
    if (!data.some(d => !d.name)) return data
    return produce(data, (draft) => {
      data.forEach((d, i) => {
        if (!d.name) {
          const existing = items.find(x => x.id === d.id)
          if (existing) draft[i] = existing
        }
      })
    })
  }

  const hasSelectionChanged = (newData: DataItem[]) =>
    !isEqual(newData.map(d => d.id), items.map(d => d.id))

  return { normalizeSelection, hasSelectionChanged }
}

const Component = () => {
  const { normalizeSelection, hasSelectionChanged } = useItemSelection(items, setItems)

  const handleSelect = (data: DataItem[]) => {
    if (!hasSelectionChanged(data)) {
      hideSelector()
      return
    }
    formattingChangedDispatcher()
    setItems(normalizeSelection(data))
    hideSelector()
  }
  return <div>...</div>
}
```

## Pattern 7: Reduce Boolean Logic Complexity

**Before** (complexity: ~8):

```typescript
const toggleDisabled = hasInsufficientPermissions
  || appUnpublished
  || missingStartNode
  || triggerModeDisabled
  || (isAdvancedApp && !currentWorkflow?.graph)
  || (isBasicApp && !basicConfig.updated_at)
```

**After** (complexity: ~3):

```typescript
const isAppReady = () => {
  if (isAdvancedApp) return !!currentWorkflow?.graph
  return !!basicConfig.updated_at
}

const hasRequiredPermissions = () =>
  isCurrentEditor && !hasInsufficientPermissions

const canToggle = () => {
  if (!hasRequiredPermissions()) return false
  if (!isAppReady()) return false
  if (missingStartNode) return false
  if (triggerModeDisabled) return false
  return true
}

const toggleDisabled = !canToggle()
```

## Pattern 8: Simplify useMemo/useCallback Dependencies

**Before** (complexity: multiple recalculations):

```typescript
const payload = useMemo(() => {
  let parameters: Parameter[] = []
  let outputParameters: OutputParameter[] = []

  if (!published) {
    parameters = (inputs || []).map(item => ({
      name: item.variable, description: '', form: 'llm',
      required: item.required, type: item.type,
    }))
    // Similar for outputParameters...
  } else if (detail?.tool) {
    parameters = (inputs || []).map(item => ({
      // Complex transformation...
    }))
  }

  return { icon: detail?.icon || icon, label: detail?.label || name, parameters, outputParameters }
}, [detail, published, icon, name, inputs, outputs])
```

**After** (complexity: separated concerns):

```typescript
const useParameterTransform = (
  inputs: InputVar[],
  detail?: ToolDetail,
  published?: boolean,
) => {
  return useMemo(() => {
    if (!published) {
      return inputs.map(item => ({
        name: item.variable, description: '', form: 'llm',
        required: item.required, type: item.type,
      }))
    }
    if (!detail?.tool) return []
    return inputs.map(item => ({
      name: item.variable, required: item.required,
      type: item.type === 'paragraph' ? 'string' : item.type,
      description: detail.tool.parameters.find(p => p.name === item.variable)?.description || '',
    }))
  }, [inputs, detail, published])
}

// Component uses hook
const parameters = useParameterTransform(inputs, detail, published)
const outputParameters = useOutputTransform(outputs, detail, published)

const payload = useMemo(() => ({
  icon: detail?.icon || icon,
  label: detail?.label || name,
  parameters,
  outputParameters,
}), [detail, icon, name, parameters, outputParameters])
```

## Target Metrics After Refactoring

| Metric | Target |
|--------|--------|
| Total Complexity | < 50 |
| Max Function Complexity | < 30 |
| Function Length | < 30 lines |
| Nesting Depth | <= 3 levels |
| Conditional Chains | <= 3 conditions |
