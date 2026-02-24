# Rule Catalog -- Code Quality

## Conditional class names use utility function

IsUrgent: True
Category: Code Quality

### Description

Ensure conditional CSS is handled via a shared classnames utility (e.g., `cn`, `clsx`, `classnames`) instead of custom ternaries, string concatenation, or template strings. Centralizing class logic keeps components consistent and easier to maintain.

### Suggested Fix

```ts
import { cn } from '@/utils/classnames'  // or clsx, classnames

const className = cn(isActive ? 'text-primary-600' : 'text-gray-500')
```

## Tailwind-first styling

IsUrgent: True
Category: Code Quality

### Description

Favor Tailwind CSS utility classes instead of adding new CSS module files unless a Tailwind combination cannot achieve the required styling. Keeping styles in Tailwind improves consistency and reduces maintenance overhead.

## Classname ordering for easy overrides

IsUrgent: False
Category: Code Quality

### Description

When writing components, always place the incoming `className` prop after the component's own class values so that downstream consumers can override or extend the styling. This keeps your component's defaults but still lets external callers change or remove specific styles.

### Example

```tsx
import { cn } from '@/utils/classnames'

const Button = ({ className }: { className?: string }) => {
  return <div className={cn('bg-primary-600 text-white px-4 py-2', className)}></div>
}
```

## Avoid inline style objects

IsUrgent: False
Category: Code Quality

### Description

Inline `style={{}}` objects create new object references on every render. Unless dynamically computed values (e.g., position, size from state) are required, prefer Tailwind classes or CSS modules instead.

### Suggested Fix

```tsx
// Bad: inline style object
<div style={{ marginTop: '16px', color: 'red' }}>

// Good: Tailwind utility
<div className="mt-4 text-red-500">
```

## Avoid magic numbers and strings

IsUrgent: False
Category: Code Quality

### Description

Replace unexplained numeric or string literals with named constants. Magic values make the code harder to understand and maintain.

### Suggested Fix

```typescript
// Bad
if (items.length > 50) { ... }

// Good
const MAX_VISIBLE_ITEMS = 50
if (items.length > MAX_VISIBLE_ITEMS) { ... }
```

Update this file when adding, editing, or removing Code Quality rules so the catalog remains accurate.
