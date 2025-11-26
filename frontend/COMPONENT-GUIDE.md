# Reusable UI Components Guide

## Overview

This guide explains the four foundational UI components we've created for the marketplace platform. These components follow best practices for React development, CSS architecture, and accessibility.

## What We Built

### 1. Button Component (`Button.tsx`)
**Purpose**: Consistent, reusable buttons for all clickable actions

**Features**:
- 5 variants: primary, secondary, outline, ghost, danger
- 3 sizes: small, medium, large
- Loading state with animated spinner
- Disabled state
- Full width option
- Icon support (left/right)
- Fully accessible (ARIA attributes, keyboard navigation)

**Usage Example**:
```tsx
<Button variant="primary" size="medium" onClick={handleSubmit}>
  Submit
</Button>

<Button variant="danger" loading={isDeleting}>
  Delete
</Button>
```

### 2. Input Component (`Input.tsx`)
**Purpose**: Form inputs with validation states and helper text

**Features**:
- Label support with required indicator
- Helper text for guidance
- Error state with error messages
- Success state with checkmark
- Disabled state
- Icon support (left/right)
- Accessible (proper label association, ARIA attributes)
- Forward ref support for focus management

**Usage Example**:
```tsx
<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
  required
  helperText="We'll never share your email"
/>
```

### 3. Card Component (`Card.tsx`)
**Purpose**: Content containers with elevation and structure

**Features**:
- 3 variants: default, outlined, elevated
- 4 padding options: none, small, medium, large
- Hover effect option
- Clickable card option (entire card is a button)
- Compound components (Card.Header, Card.Body, Card.Footer)
- Accessible (semantic HTML, keyboard navigation)

**Usage Example**:
```tsx
<Card variant="elevated" padding="medium" hoverable>
  <Card.Header>
    <h3>Card Title</h3>
  </Card.Header>
  <Card.Body>
    <p>Card content goes here</p>
  </Card.Body>
  <Card.Footer>
    <Button>Action</Button>
  </Card.Footer>
</Card>
```

### 4. Modal Component (`Modal.tsx`)
**Purpose**: Dialog overlays for focused interactions

**Features**:
- 4 sizes: small, medium, large, full
- Backdrop click to close (optional)
- ESC key to close
- Focus trap and management
- Scroll lock (prevents body scroll)
- Compound components (Modal.Body, Modal.Footer)
- Portal rendering (renders outside parent DOM)
- Smooth animations
- Fully accessible (ARIA attributes, focus management)

**Usage Example**:
```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  size="medium"
>
  <Modal.Body>
    <p>Are you sure?</p>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
    <Button variant="danger" onClick={handleDelete}>Delete</Button>
  </Modal.Footer>
</Modal>
```

## Key Concepts Explained

### CSS Modules
**What**: CSS files with `.module.css` extension that provide scoped styling

**Why**: 
- Prevents style conflicts (`.button` in one component won't affect `.button` in another)
- Automatic unique class name generation
- Better maintainability
- Type-safe class names with TypeScript

**How it works**:
```tsx
import styles from './Button.module.css';

// In CSS: .button { ... }
// In JSX: <button className={styles.button}>
// Rendered: <button class="Button_button__a3x9z">
```

### BEM Naming Convention
**What**: Block Element Modifier - a naming methodology for CSS classes

**Structure**:
- **Block**: `.button` - The component itself
- **Element**: `.button__icon` - A part of the component
- **Modifier**: `.button--primary` - A variation of the component

**Why**: 
- Clear, descriptive class names
- Easy to understand component structure
- Prevents naming conflicts
- Scales well for large projects

**Example**:
```css
.button { }                    /* Block */
.button__icon { }              /* Element */
.button--primary { }           /* Modifier */
.button--large { }             /* Modifier */
```

### Component Reusability
**What**: Writing components once and using them throughout the app

**Benefits**:
- **Consistency**: All buttons look and behave the same
- **Maintainability**: Change one file to update all instances
- **Efficiency**: Less code to write and test
- **Reliability**: Well-tested components reduce bugs

**Example**:
Instead of writing button styles 50 times:
```tsx
// ❌ Bad: Repeating styles everywhere
<button style={{ padding: '8px 16px', backgroundColor: 'blue' }}>Click</button>
<button style={{ padding: '8px 16px', backgroundColor: 'blue' }}>Submit</button>
// ... 48 more times

// ✅ Good: Reusable component
<Button variant="primary">Click</Button>
<Button variant="primary">Submit</Button>
```

### Compound Components Pattern
**What**: Components that work together to form a complete UI

**Example**: Card.Header, Card.Body, Card.Footer

**Benefits**:
- Clear, semantic API
- Flexible composition
- Consistent styling
- Easy to understand

**Usage**:
```tsx
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Actions</Card.Footer>
</Card>
```

### React Portals
**What**: Rendering components outside the parent DOM hierarchy

**Used in**: Modal component

**Why**: 
- Avoid z-index issues
- Proper stacking context
- Prevent CSS inheritance problems

**How it works**:
```tsx
// Modal is defined in your component tree
<div className="parent">
  <Modal>Content</Modal>
</div>

// But renders at document.body level
<body>
  <div id="root">
    <div className="parent"></div>
  </div>
  <div class="modal">Content</div>  <!-- Rendered here via portal -->
</body>
```

## Design System Integration

All components use CSS variables from `variables.css`:

```css
/* Colors */
var(--color-primary)
var(--color-text-primary)
var(--color-background)

/* Spacing */
var(--space-sm)
var(--space-md)
var(--space-lg)

/* Typography */
var(--font-size-base)
var(--font-weight-medium)

/* Borders */
var(--radius-md)

/* Shadows */
var(--shadow-md)

/* Transitions */
var(--transition-fast)
```

This ensures:
- Consistent styling across all components
- Easy theming (change variables, update everywhere)
- Dark mode support (variables change based on preference)
- Maintainability (single source of truth)

## Accessibility Features

All components follow accessibility best practices:

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Proper focus states with `:focus-visible`
- Tab order follows logical flow

### Screen Readers
- Proper ARIA attributes (`aria-label`, `aria-busy`, `aria-invalid`)
- Semantic HTML (`<button>`, `<label>`, `role="dialog"`)
- Associated labels and inputs (`htmlFor` and `id`)

### Motion Preferences
- Respects `prefers-reduced-motion` setting
- Disables animations for users who prefer reduced motion

### Color Contrast
- All text meets WCAG AA standards
- Focus indicators are clearly visible

## File Structure

```
frontend/src/components/
├── Button.tsx              # Button component
├── Button.module.css       # Button styles
├── Input.tsx               # Input component
├── Input.module.css        # Input styles
├── Card.tsx                # Card component
├── Card.module.css         # Card styles
├── Modal.tsx               # Modal component
├── Modal.module.css        # Modal styles
├── ComponentExamples.tsx   # Usage examples
└── index.ts                # Barrel export file
```

## Next Steps

These components are ready to use throughout the application. In upcoming tasks, we'll:

1. Set up API client and React Query (Task 34)
2. Create authentication context using these components (Task 36)
3. Build pages using these components (Tasks 37-60)

## Testing the Components

To see all components in action:

1. Import `ComponentExamples` into your `App.tsx`:
```tsx
import ComponentExamples from './components/ComponentExamples';

function App() {
  return <ComponentExamples />;
}
```

2. Run the development server:
```bash
# Working directory: frontend/
npm run dev
```

3. Open your browser to see all components with examples

## Common Patterns

### Form with Validation
```tsx
const [email, setEmail] = useState('');
const [error, setError] = useState('');

const handleSubmit = () => {
  if (!email.includes('@')) {
    setError('Invalid email');
    return;
  }
  // Submit form
};

return (
  <Card>
    <Card.Body>
      <Input
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error}
        required
      />
    </Card.Body>
    <Card.Footer>
      <Button variant="primary" onClick={handleSubmit}>
        Submit
      </Button>
    </Card.Footer>
  </Card>
);
```

### Confirmation Dialog
```tsx
const [isOpen, setIsOpen] = useState(false);

const handleDelete = () => {
  // Delete logic
  setIsOpen(false);
};

return (
  <>
    <Button variant="danger" onClick={() => setIsOpen(true)}>
      Delete
    </Button>
    
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Confirm Deletion"
    >
      <Modal.Body>
        Are you sure you want to delete this item?
      </Modal.Body>
      <Modal.Footer>
        <Button variant="ghost" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDelete}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  </>
);
```

### Clickable Card Grid
```tsx
const listings = [...]; // Your data

return (
  <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
    {listings.map(listing => (
      <Card
        key={listing.id}
        variant="outlined"
        hoverable
        onClick={() => navigate(`/listing/${listing.id}`)}
      >
        <Card.Body>
          <h3>{listing.title}</h3>
          <p>{listing.price}</p>
        </Card.Body>
      </Card>
    ))}
  </div>
);
```

## Summary

We've successfully created four foundational UI components that:
- Follow React and CSS best practices
- Use CSS Modules for scoped styling
- Follow BEM naming convention
- Are fully accessible
- Are highly reusable
- Integrate with our design system
- Include comprehensive documentation

These components will serve as the building blocks for all UI features in the marketplace platform.
