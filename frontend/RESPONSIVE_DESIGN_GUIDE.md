# Responsive Design Guide

## Overview

This marketplace platform is built with a **mobile-first responsive design** approach, ensuring an optimal user experience across all devices from mobile phones to large desktop screens.

## What is Mobile-First Design?

Mobile-first design means we start by designing for the smallest screens first, then progressively enhance the experience for larger screens. This approach:

1. **Forces prioritization** - We focus on essential content first
2. **Improves performance** - Mobile users get optimized, lightweight styles
3. **Simplifies maintenance** - Easier to add features than remove them
4. **Better accessibility** - Touch-friendly interfaces benefit all users

## Breakpoints

Our responsive design uses these breakpoints (defined in `variables.css`):

| Breakpoint | Width | Target Devices | Usage |
|------------|-------|----------------|-------|
| **Mobile** | < 640px | Phones | Base styles (no media query needed) |
| **Tablet** | 640px - 1023px | Tablets, large phones | `@media (min-width: 640px)` |
| **Desktop** | 1024px+ | Laptops, desktops | `@media (min-width: 1024px)` |
| **Large Desktop** | 1280px+ | Large monitors | `@media (min-width: 1280px)` |

### Common Device Sizes

- **iPhone SE**: 375px
- **iPhone 12/13**: 390px
- **iPad**: 768px
- **iPad Pro**: 1024px
- **Desktop**: 1280px+

## Key Responsive Patterns

### 1. Responsive Containers

```css
.container {
  width: 100%;
  padding: var(--space-md); /* Mobile: 16px */
}

@media (min-width: 768px) {
  .container {
    padding: var(--space-lg); /* Tablet: 24px */
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
    padding: var(--space-xl); /* Desktop: 32px */
  }
}
```

### 2. Responsive Grids

We use CSS Grid with `auto-fit` for automatically responsive layouts:

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

### 3. Responsive Typography

Font sizes scale down on mobile for better readability:

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

### 4. Stacking Layouts

Horizontal layouts on desktop stack vertically on mobile:

```css
.layout {
  display: flex;
  flex-direction: column; /* Mobile: Stack vertically */
  gap: var(--space-md);
}

@media (min-width: 768px) {
  .layout {
    flex-direction: row; /* Desktop: Side by side */
  }
}
```

### 5. Touch-Friendly Interactions

All interactive elements meet minimum touch target sizes:

- **Minimum size**: 44x44px (Apple/Google recommendation)
- **Buttons**: Larger padding on mobile
- **Links**: Adequate spacing between clickable elements
- **Forms**: Full-width inputs on mobile

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

## Responsive Components

### Pages

All pages are fully responsive:

- **HomePage**: Hero section scales, grid adjusts columns
- **SearchPage**: Sidebar stacks on mobile, grid adapts
- **ListingDetailPage**: Two-column layout becomes single column
- **ProfilePage**: Avatar and info stack vertically on mobile
- **MessagesInboxPage**: Conversation cards optimize for mobile
- **ConversationPage**: Full-height chat interface on all devices
- **CreateListingPage**: Form fields stack, full-width inputs
- **MyListingsPage**: Listing cards stack, actions reorganize

### Components

All components are responsive:

- **Button**: Adjusts size, can be full-width
- **Input**: Full-width on mobile, proper touch targets
- **Card**: Padding adjusts, sections stack if needed
- **Modal**: Full-screen on mobile, centered on desktop
- **FilterPanel**: Stacks filters, full-width controls
- **ListingCard**: Image height adjusts, metadata stacks

## Testing Responsive Design

### Browser DevTools

1. **Open DevTools**: F12 or Right-click → Inspect
2. **Toggle Device Toolbar**: Ctrl+Shift+M (Windows) or Cmd+Shift+M (Mac)
3. **Select Device**: Choose from presets or enter custom dimensions
4. **Test Interactions**: Click, scroll, test forms

### Recommended Test Devices

Test on these device sizes:

- **Mobile**: 375px (iPhone SE), 390px (iPhone 12)
- **Tablet**: 768px (iPad), 1024px (iPad Pro)
- **Desktop**: 1280px, 1920px

### What to Test

- [ ] All pages load correctly on mobile
- [ ] Navigation is accessible and usable
- [ ] Forms are easy to fill out on mobile
- [ ] Buttons are easy to tap (44x44px minimum)
- [ ] Text is readable without zooming
- [ ] Images scale properly
- [ ] Grids adjust column count appropriately
- [ ] Modals work well on mobile (full-screen)
- [ ] No horizontal scrolling (except intentional)
- [ ] Touch gestures work (swipe, pinch-zoom where appropriate)

## Responsive Utilities

We provide utility classes in `responsive.css`:

### Visibility

```css
.hide-mobile /* Hide on mobile, show on tablet+ */
.show-mobile /* Show on mobile, hide on tablet+ */
.hide-tablet /* Hide on tablet only */
```

### Containers

```css
.container-responsive /* Responsive padding and max-width */
```

### Grids

```css
.grid-responsive /* 1/2/3 column responsive grid */
.grid-responsive-4 /* 1/2/3/4 column responsive grid */
```

### Flexbox

```css
.flex-responsive /* Column on mobile, row on desktop */
.flex-responsive-reverse /* Row on mobile, column on desktop */
```

### Touch Targets

```css
.touch-target /* Minimum 44x44px size */
.touch-target-expanded /* Expanded tap area */
```

## Best Practices

### 1. Always Start Mobile-First

```css
/* ✅ GOOD: Mobile-first */
.element {
  font-size: 14px; /* Mobile */
}

@media (min-width: 768px) {
  .element {
    font-size: 16px; /* Desktop */
  }
}

/* ❌ BAD: Desktop-first */
.element {
  font-size: 16px; /* Desktop */
}

@media (max-width: 767px) {
  .element {
    font-size: 14px; /* Mobile */
  }
}
```

### 2. Use CSS Variables

Always use design system variables for consistency:

```css
/* ✅ GOOD */
padding: var(--space-md);
color: var(--color-primary);

/* ❌ BAD */
padding: 16px;
color: #3b82f6;
```

### 3. Test on Real Devices

- Emulators are good, but real devices are better
- Test touch interactions, not just visual layout
- Check performance on lower-end devices
- Test with different font sizes (accessibility)

### 4. Consider Touch vs Mouse

```css
/* Larger touch targets on mobile */
@media (max-width: 640px) {
  .button {
    min-height: 44px;
    padding: var(--space-md);
  }
}

/* Hover effects only on devices that support hover */
@media (hover: hover) {
  .button:hover {
    background-color: var(--color-primary-dark);
  }
}
```

### 5. Optimize Images

```css
.image {
  max-width: 100%;
  height: auto;
  display: block;
}
```

### 6. Prevent Horizontal Scroll

```css
* {
  box-sizing: border-box;
}

body {
  overflow-x: hidden;
}
```

### 7. Use Relative Units

```css
/* ✅ GOOD: Relative units */
width: 100%;
padding: 1rem;
font-size: 1.125rem;

/* ❌ BAD: Fixed pixels */
width: 1200px;
padding: 16px;
font-size: 18px;
```

## Accessibility Considerations

### 1. Reduced Motion

Respect user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

### 2. Focus Indicators

Ensure keyboard navigation works:

```css
.button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### 3. Color Contrast

Maintain WCAG AA contrast ratios:
- Normal text: 4.5:1
- Large text: 3:1
- Interactive elements: 3:1

### 4. Touch Target Size

Minimum 44x44px for all interactive elements.

## Common Responsive Patterns

### Sidebar Layout

```css
.layout {
  display: grid;
  grid-template-columns: 1fr; /* Mobile: Stack */
  gap: var(--space-lg);
}

@media (min-width: 768px) {
  .layout {
    grid-template-columns: 250px 1fr; /* Desktop: Sidebar + Main */
  }
}
```

### Card Grid

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-lg);
}
```

### Navigation

```css
.nav {
  display: flex;
  flex-direction: column; /* Mobile: Vertical */
}

@media (min-width: 768px) {
  .nav {
    flex-direction: row; /* Desktop: Horizontal */
  }
}
```

### Modal

```css
.modal {
  position: fixed;
  inset: 0; /* Mobile: Full-screen */
  border-radius: 0;
}

@media (min-width: 768px) {
  .modal {
    position: relative;
    inset: auto;
    max-width: 600px;
    border-radius: var(--radius-lg);
  }
}
```

## Performance Tips

1. **Minimize CSS**: Use CSS Modules to scope styles
2. **Optimize Images**: Use appropriate sizes for each breakpoint
3. **Lazy Load**: Load images and components as needed
4. **Critical CSS**: Inline critical styles for above-the-fold content
5. **Reduce Reflows**: Avoid layout thrashing with animations

## Resources

- [MDN: Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [CSS Tricks: A Complete Guide to Grid](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Web.dev: Responsive Web Design Basics](https://web.dev/responsive-web-design-basics/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Troubleshooting

### Issue: Horizontal Scrolling

**Solution**: Check for fixed-width elements, ensure `box-sizing: border-box`

```css
* {
  box-sizing: border-box;
}
```

### Issue: Text Too Small on Mobile

**Solution**: Use relative font sizes, test with different zoom levels

```css
body {
  font-size: 16px; /* Never go below 16px on mobile */
}
```

### Issue: Buttons Too Small to Tap

**Solution**: Ensure minimum 44x44px touch targets

```css
.button {
  min-height: 44px;
  min-width: 44px;
}
```

### Issue: Images Breaking Layout

**Solution**: Use responsive image techniques

```css
img {
  max-width: 100%;
  height: auto;
}
```

## Conclusion

Responsive design is not just about making things fit on smaller screens—it's about creating an optimal experience for every user, regardless of their device. By following mobile-first principles, using our design system, and testing thoroughly, we ensure our marketplace works beautifully everywhere.
