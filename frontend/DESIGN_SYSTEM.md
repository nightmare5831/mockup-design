# MockupAI Design System

A comprehensive design system for consistent and maintainable UI components across the MockupAI application.

## Quick Start

### Buttons

Use the enhanced Button component with semantic variants:

```tsx
import { Button } from '@/components/ui/button';

// Primary actions (main CTAs)
<Button variant="primary">Generate AI Mockup</Button>

// Secondary actions  
<Button variant="secondary">Cancel</Button>

// Subtle actions
<Button variant="ghost">Settings</Button>

// Outlined actions
<Button variant="outline">Learn More</Button>

// Destructive actions
<Button variant="destructive">Delete Project</Button>

// Different sizes
<Button variant="primary" size="sm">Small</Button>
<Button variant="primary" size="lg">Large</Button>
<Button variant="primary" disabled>Disabled</Button>
```

### Badges

Use badges for status indicators and labels:

```tsx
import { Badge } from '@/components/ui/badge';

// Status badges
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="info">Processing</Badge>

// Data badges
<Badge variant="primary">150 Credits</Badge>
<Badge variant="outline">Free Plan</Badge>

// Different sizes
<Badge variant="primary" size="sm">Small</Badge>
<Badge variant="primary" size="lg">Large</Badge>
```

### Cards

Use cards for content containers:

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

// Standard card
<Card variant="default">
  <CardHeader>
    <CardTitle>Project Name</CardTitle>
    <CardDescription>Project description</CardDescription>
  </CardHeader>
  <CardContent>
    Card content here
  </CardContent>
</Card>

// Elevated card (for important content)
<Card variant="elevated">
  <CardContent>Important content</CardContent>
</Card>

// Outlined card (for forms)
<Card variant="outlined">
  <CardContent>Form content</CardContent>
</Card>
```

## Design System Utilities

For advanced usage, import the design system utilities:

```tsx
import { buttonPresets, badgePresets, cardPresets } from '@/lib/design-system';

// Use presets for consistent styling
<Button variant={buttonPresets.primary}>Primary Action</Button>
<Badge variant={badgePresets.credits}>Credits Badge</Badge>
<Card variant={cardPresets.elevated}>Elevated Card</Card>
```

## CSS Variables

The design system is built on CSS variables defined in `src/index.css`:

### Brand Colors
- `--brand-primary`: #0066FF (Primary blue)
- `--brand-secondary`: #00D1FF (Secondary cyan)  
- `--brand-accent`: #FFD700 (Accent gold)

### Semantic Colors
- `--success`: Green for positive states
- `--warning`: Yellow for attention states
- `--destructive`: Red for negative states
- `--info`: Blue for informational states

### Using CSS Variables

```css
.custom-component {
  background: hsl(var(--brand-primary));
  color: hsl(var(--primary-foreground));
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

## Tailwind Extensions

The design system extends Tailwind with custom utilities:

```tsx
// Brand colors
<div className="text-brand-primary bg-brand-secondary">Brand Colors</div>

// Semantic colors  
<div className="text-success bg-warning">Semantic Colors</div>

// Gradients
<div className="bg-gradient-primary">Primary Gradient</div>

// Shadows
<div className="shadow-md hover:shadow-lg">Consistent Shadows</div>
```

## Component Presets

Pre-defined CSS classes for common patterns:

```tsx
// In your CSS or className
className="btn-primary"     // Primary button styles
className="badge-success"   // Success badge styles  
className="card-elevated"   // Elevated card styles
```

## Dark Mode Support

All components automatically support dark mode:

```tsx
// Colors automatically adapt to dark mode
<Button variant="primary">Works in both modes</Button>
<Badge variant="success">Adapts to theme</Badge>
<Card variant="default">Dark mode ready</Card>
```

## Best Practices

### Button Usage
- **Primary**: Main actions like "Generate", "Save", "Create"
- **Secondary**: Secondary actions like "Cancel", "Back"  
- **Outline**: Subtle actions or toggles
- **Ghost**: Navigation or minimal actions
- **Destructive**: Delete or dangerous actions

### Badge Usage  
- **Success**: Completed, active, positive status
- **Warning**: Pending, loading, needs attention
- **Destructive**: Errors, failed status
- **Primary**: Credits, important metrics
- **Outline**: Plans, categories, neutral labels

### Card Usage
- **Default**: Most content containers
- **Elevated**: Modals, featured content, important items
- **Outlined**: Forms, inputs, structured data
- **Flat**: Subtle grouping, secondary content

## Spacing & Layout

Use consistent spacing utilities:

```tsx
// Consistent gaps
<div className="space-x-4">Horizontal spacing</div>
<div className="space-y-6">Vertical spacing</div>

// Consistent padding  
<div className="p-6">Standard padding</div>
<div className="p-3">Small padding</div>
<div className="p-8">Large padding</div>
```

## Typography

Use semantic typography classes:

```tsx
<h1 className="text-3xl font-heading font-bold">Main Heading</h1>
<h2 className="text-2xl font-heading font-semibold">Section Heading</h2>
<p className="text-base font-body">Body text</p>
<span className="text-sm text-muted-foreground">Caption text</span>
```

## Examples

See `src/components/Examples/DesignSystemExample.tsx` for comprehensive usage examples.

## Extending the Design System

To add new variants or components:

1. Update the CSS variables in `src/index.css`
2. Add new variants to component files (e.g., `button.tsx`)
3. Update the design system utilities in `src/lib/design-system.ts`
4. Document the new patterns in this file

## Migration Guide

### From Old Patterns

Replace custom Tailwind classes with design system components:

```tsx
// Old
<button className="bg-gradient-to-br from-blue-600 to-cyan-500 text-white px-4 py-2 rounded-lg">
  Button
</button>

// New  
<Button variant="primary">Button</Button>

// Old
<div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">Badge</div>

// New
<Badge variant="primary">Badge</Badge>
```

This ensures consistency and makes future maintenance much easier.