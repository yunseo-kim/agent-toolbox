# Component Splitting Patterns

Detailed guidance on splitting large components into smaller, focused components.

## When to Split Components

Split a component when you identify:

1. **Multiple UI sections** - Distinct visual areas with minimal coupling
2. **Conditional rendering blocks** - Large `{condition && <JSX />}` blocks
3. **Repeated patterns** - Similar UI structures used multiple times
4. **300+ lines** - Component exceeds manageable size
5. **Modal clusters** - Multiple modals rendered in one component

## Splitting Strategies

### Strategy 1: Section-Based Splitting

Identify visual sections and extract each as a component.

```typescript
// Before: Monolithic component (500+ lines)
const ConfigurationPage = () => {
  return (
    <div>
      {/* Header Section - 50 lines */}
      <div className="header">
        <h1>{t('configuration.title')}</h1>
        <div className="actions">
          {isAdvancedMode && <Badge>Advanced</Badge>}
          <ModelParameterModal ... />
          <AppPublisher ... />
        </div>
      </div>

      {/* Config Section - 200 lines */}
      <div className="config"><Config /></div>

      {/* Debug Section - 150 lines */}
      <div className="debug"><Debug ... /></div>

      {/* Modals Section - 100 lines */}
      {showSelectData && <SelectDataModal ... />}
      {showHistoryModal && <EditHistoryModal ... />}
      {showConfirm && <Confirm ... />}
    </div>
  )
}

// After: Split into focused components
// configuration/
//   index.tsx              (orchestration)
//   configuration-header.tsx
//   configuration-content.tsx
//   configuration-debug.tsx
//   configuration-modals.tsx

const ConfigurationPage = () => {
  const { modelConfig, setModelConfig } = useModelConfig()
  const { activeModal, openModal, closeModal } = useModalState()

  return (
    <div>
      <ConfigurationHeader
        isAdvancedMode={isAdvancedMode}
        onPublish={handlePublish}
      />
      <ConfigurationContent
        modelConfig={modelConfig}
        onConfigChange={setModelConfig}
      />
      {!isMobile && (
        <ConfigurationDebug inputs={inputs} onSetting={handleSetting} />
      )}
      <ConfigurationModals activeModal={activeModal} onClose={closeModal} />
    </div>
  )
}
```

### Strategy 2: Conditional Block Extraction

Extract large conditional rendering blocks.

```typescript
// Before: Large conditional blocks
const AppInfo = () => {
  return (
    <div>
      {expand ? (
        <div className="expanded">{/* 100 lines */}</div>
      ) : (
        <div className="collapsed">{/* 50 lines */}</div>
      )}
    </div>
  )
}

// After: Separate view components
const AppInfoExpanded: FC<AppInfoViewProps> = ({ detail, onAction }) => (
  <div className="expanded">{/* Clean, focused */}</div>
)

const AppInfoCollapsed: FC<AppInfoViewProps> = ({ detail, onAction }) => (
  <div className="collapsed">{/* Clean, focused */}</div>
)

const AppInfo = () => (
  <div>
    {expand
      ? <AppInfoExpanded detail={detail} onAction={handleAction} />
      : <AppInfoCollapsed detail={detail} onAction={handleAction} />}
  </div>
)
```

### Strategy 3: Modal Extraction

Extract modals with their trigger logic.

```typescript
// Before: Multiple modals in one component
const AppInfo = () => {
  const [showEdit, setShowEdit] = useState(false)
  const [showDuplicate, setShowDuplicate] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const onEdit = async (data) => { /* 20 lines */ }
  const onDuplicate = async (data) => { /* 20 lines */ }
  const onDelete = async () => { /* 15 lines */ }

  return (
    <div>
      {/* Main content */}
      {showEdit && <EditModal onConfirm={onEdit} onClose={() => setShowEdit(false)} />}
      {showDuplicate && <DuplicateModal onConfirm={onDuplicate} onClose={() => setShowDuplicate(false)} />}
      {showDelete && <DeleteConfirm onConfirm={onDelete} onClose={() => setShowDelete(false)} />}
    </div>
  )
}

// After: Modal manager component
type ModalType = 'edit' | 'duplicate' | 'delete' | null

interface AppInfoModalsProps {
  detail: AppDetail
  activeModal: ModalType
  onClose: () => void
  onSuccess: () => void
}

const AppInfoModals: FC<AppInfoModalsProps> = ({ detail, activeModal, onClose, onSuccess }) => {
  const handleEdit = async (data) => { /* logic */ }
  const handleDuplicate = async (data) => { /* logic */ }
  const handleDelete = async () => { /* logic */ }

  return (
    <>
      {activeModal === 'edit' && <EditModal detail={detail} onConfirm={handleEdit} onClose={onClose} />}
      {activeModal === 'duplicate' && <DuplicateModal detail={detail} onConfirm={handleDuplicate} onClose={onClose} />}
      {activeModal === 'delete' && <DeleteConfirm onConfirm={handleDelete} onClose={onClose} />}
    </>
  )
}

// Parent component
const AppInfo = () => {
  const { activeModal, openModal, closeModal } = useModalState()

  return (
    <div>
      <Button onClick={() => openModal('edit')}>Edit</Button>
      <AppInfoModals detail={detail} activeModal={activeModal} onClose={closeModal} onSuccess={handleSuccess} />
    </div>
  )
}
```

### Strategy 4: List Item Extraction

Extract repeated item rendering.

```typescript
// Before: Inline item rendering
const OperationsList = () => (
  <div>
    {operations.map(op => (
      <div key={op.id} className="operation-item">
        <span className="icon">{op.icon}</span>
        <span className="title">{op.title}</span>
        <span className="description">{op.description}</span>
        <button onClick={() => op.onClick()}>{op.actionLabel}</button>
        {op.badge && <Badge>{op.badge}</Badge>}
      </div>
    ))}
  </div>
)

// After: Extracted item component
const OperationItem: FC<{ operation: Operation; onAction: (id: string) => void }> = ({
  operation, onAction,
}) => (
  <div className="operation-item">
    <span className="icon">{operation.icon}</span>
    <span className="title">{operation.title}</span>
    <span className="description">{operation.description}</span>
    <button onClick={() => onAction(operation.id)}>{operation.actionLabel}</button>
    {operation.badge && <Badge>{operation.badge}</Badge>}
  </div>
)

const OperationsList = () => {
  const handleAction = useCallback((id: string) => {
    operations.find(o => o.id === id)?.onClick()
  }, [operations])

  return (
    <div>
      {operations.map(op => (
        <OperationItem key={op.id} operation={op} onAction={handleAction} />
      ))}
    </div>
  )
}
```

## Directory Structure Patterns

### Pattern A: Flat Structure (Simple Components)

For components with 2-3 sub-components:

```
component-name/
  index.tsx           # Main component
  sub-component-a.tsx
  sub-component-b.tsx
  types.ts            # Shared types
```

### Pattern B: Nested Structure (Complex Components)

For components with many sub-components:

```
component-name/
  index.tsx           # Main orchestration
  types.ts            # Shared types
  hooks/
    use-feature-a.ts
    use-feature-b.ts
  components/
    header/
      index.tsx
    content/
      index.tsx
    modals/
      index.tsx
  utils/
    helpers.ts
```

### Pattern C: Feature-Based Structure

For large feature areas:

```
configuration/
  index.tsx           # Main page component
  base/               # Base/shared components
    feature-panel/
    operation-btn/
  config/             # Config section
    index.tsx
    agent/
    automatic/
  dataset-config/     # Dataset section
    index.tsx
    card-item/
    params-config/
  debug/              # Debug section
    index.tsx
    hooks.tsx
  hooks/              # Shared hooks
    use-advanced-config.ts
```

## Props Design

### Minimal Props Principle

Pass only what's needed:

```typescript
// Bad: Passing entire objects when only some fields needed
<ConfigHeader appDetail={appDetail} modelConfig={modelConfig} />

// Good: Destructure to minimum required
<ConfigHeader
  appName={appDetail.name}
  isAdvancedMode={modelConfig.isAdvanced}
  onPublish={handlePublish}
/>
```

### Callback Props Pattern

Use callbacks for child-to-parent communication:

```typescript
interface ChildProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
}

const Child: FC<ChildProps> = ({ value, onChange, onSubmit }) => (
  <div>
    <input value={value} onChange={e => onChange(e.target.value)} />
    <button onClick={onSubmit}>Submit</button>
  </div>
)
```

### Render Props for Flexibility

When sub-components need parent context:

```typescript
interface ListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  renderEmpty?: () => React.ReactNode
}

function List<T>({ items, renderItem, renderEmpty }: ListProps<T>) {
  if (items.length === 0 && renderEmpty) return <>{renderEmpty()}</>
  return <div>{items.map((item, index) => renderItem(item, index))}</div>
}

// Usage
<List
  items={operations}
  renderItem={(op, i) => <OperationItem key={i} operation={op} />}
  renderEmpty={() => <EmptyState message="No operations" />}
/>
```
