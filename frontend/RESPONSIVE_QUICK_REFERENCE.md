# Responsive Design Quick Reference

## Breakpoints

```css
/* Mobile (base) - No media query needed */
.element { /* styles */ }

/* Tablet (640px+) */
@media (min-width: 640px) {
  .element { /* styles */ }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .element { /* styles */ }
}

/* Large Desktop (1280px+) */
@media (min-width: 1280px) {
  .element { /* styles */ }
}
```

## Common Patterns

### Responsive Grid

```css
.grid {
  display: grid;
  grid-template-columns: 1fr; /* Mobile: 1 column */
  gap: var(--space-md);
}

@media (min-width: 640px) {
  .grid {
    grid-template-columns: repeat(2, 1fr); /* Tablet: 2 columns */
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr); /* Desktop: 3 columns */
  }
}
```

### Stacking Layout

```css
.layout {
  display: flex;
  flex-direction: column; /* Mobile: Stack */
  gap: var(--space-md);
}

@media (min-width: 768px) {
  .layout {
    flex-direction: row; /* Desktop: Side by side */
  }
}
```

### Responsive Typography

```css
.title {
  font-size: var(--font-size-2xl); /* Mobile: 24px */
}

@media (min-width: 768px) {
  .title {
    font-size: var(--font-size-3xl); /* Tablet: 32px */
  }
}

@media (min-width: 1024px) {
  .title {
    font-size: var(--font-size-4xl); /* Desktop: 40px */
  }
}
```

### Touch-Friendly Button

```css
.button {
  min-height: 44px; /* Touch-friendly */
  padding: var(--space-sm) var(--space-md);
}

@media (max-width: 640px) {
  .button {
    width: 100%; /* Full-width on mobile */
  }
}
```

## Utility Classes

### Visibility

```html
<div class="hide-mobile">Only visible on tablet+</div>
<div class="show-mobile">Only visible on mobile</div>
```

### Responsive Container

```html
<div class="container-responsive">
  <!-- Auto-adjusting padding and max-width -->
</div>
```

### Responsive Grid

```html
<div class="grid-responsive">
  <!-- 1/2/3 columns automatically -->
</div>
```

### Touch Target

```html
<button class="touch-target">
  <!-- Minimum 44x44px -->
</button>
```

## CSS Variables

### Spacing

```css
var(--space-xs)   /* 4px */
var(--space-sm)   /* 8px */
var(--space-md)   /* 16px */
var(--space-lg)   /* 24px */
var(--space-xl)   /* 32px */
var(--space-2xl)  /* 48px */
```

### Font Sizes

```css
var(--font-size-xs)   /* 12px */
var(--font-size-sm)   /* 14px */
var(--font-size-base) /* 16px */
var(--font-size-lg)   /* 18px */
var(--font-size-xl)   /* 20px */
var(--font-size-2xl)  /* 24px */
var(--font-size-3xl)  /* 32px */
var(--font-size-4xl)  /* 40px */
```

### Breakpoints (for reference)

```css
var(--breakpoint-sm)  /* 640px */
var(--breakpoint-md)  /* 768px */
var(--breakpoint-lg)  /* 1024px */
var(--breakpoint-xl)  /* 1280px */
```

## Testing Checklist

- [ ] No horizontal scrolling
- [ ] All content accessible
- [ ] Touch targets 44x44px minimum
- [ ] Text readable without zooming
- [ ] Images scale properly
- [ ] Forms easy to use
- [ ] Navigation accessible

## Common Device Sizes

- iPhone SE: 375px
- iPhone 12: 390px
- iPad: 768px
- iPad Pro: 1024px
- Desktop: 1280px+

## Quick Tips

1. **Always start mobile-first** - Base styles for mobile, enhance for desktop
2. **Use CSS variables** - Consistent spacing and colors
3. **Test on real devices** - Emulators are good, real devices are better
4. **44x44px minimum** - For all touch targets
5. **16px minimum** - For body text on mobile
6. **Use relative units** - rem, em, %, not fixed px
7. **Respect reduced motion** - `@media (prefers-reduced-motion: reduce)`

## Resources

- Full Guide: `frontend/RESPONSIVE_DESIGN_GUIDE.md`
- Testing Checklist: `frontend/RESPONSIVE_TESTING_CHECKLIST.md`
- Implementation Details: `RESPONSIVE_DESIGN_IMPLEMENTATION.md`
