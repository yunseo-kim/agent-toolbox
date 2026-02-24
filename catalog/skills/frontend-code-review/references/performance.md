# Rule Catalog -- Performance

## Complex prop memoization

IsUrgent: True
Category: Performance

### Description

Wrap complex prop values (objects, arrays, maps) in `useMemo` prior to passing them into child components to guarantee stable references and prevent unnecessary renders.

### Example

```tsx
// Wrong: new object reference every render
<HeavyComp
  config={{
    provider: providerValue,
    detail: detailValue,
  }}
/>

// Right: stable reference
const config = useMemo(() => ({
  provider: providerValue,
  detail: detailValue,
}), [providerValue, detailValue])

<HeavyComp config={config} />
```

## Callback memoization with useCallback

IsUrgent: True
Category: Performance

### Description

Wrap callback props passed to memoized children in `useCallback` to prevent breaking `React.memo` or `useMemo` boundaries. Unstable function references cause unnecessary re-renders in child components.

### Example

```tsx
// Wrong: new function reference every render
<MemoizedChild onClick={() => handleClick(id)} />

// Right: stable callback
const handleItemClick = useCallback(() => handleClick(id), [id])
<MemoizedChild onClick={handleItemClick} />
```

## Avoid expensive computations in render

IsUrgent: True
Category: Performance

### Description

Move expensive computations (large array sorts, complex filtering, deep object transformations) into `useMemo` to avoid recalculating on every render. Only recalculate when dependencies change.

### Example

```typescript
// Wrong: sorts on every render
const sortedItems = items.sort((a, b) => a.name.localeCompare(b.name))

// Right: memoized sort
const sortedItems = useMemo(
  () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
  [items],
)
```

## State management hook usage

IsUrgent: True
Category: Performance

### Description

When using state management libraries (Zustand, Redux, Jotai), prefer selector-based subscriptions over consuming the entire store. Use dedicated hooks for reading data and store API methods inside callbacks for mutations to prevent unnecessary re-renders.

### Example

```typescript
// Wrong: subscribes to entire store, re-renders on any change
const store = useStore()
const items = store.items

// Right: selector only subscribes to `items`
const items = useStore(state => state.items)
```

## Virtualize long lists

IsUrgent: False
Category: Performance

### Description

For lists exceeding ~100 items, use a virtualization library (`@tanstack/react-virtual`, `react-window`, `react-virtuoso`) to render only visible items. Rendering thousands of DOM nodes degrades scroll performance.

## Lazy load heavy components

IsUrgent: False
Category: Performance

### Description

Use `React.lazy()` and `Suspense` for components not needed on initial render (modals, settings panels, editor views). This reduces initial bundle size and improves time-to-interactive.

### Example

```tsx
const SettingsPanel = React.lazy(() => import('./settings-panel'))

const App = () => (
  <Suspense fallback={<Loading />}>
    {showSettings && <SettingsPanel />}
  </Suspense>
)
```

Update this file when adding, editing, or removing Performance rules so the catalog remains accurate.
