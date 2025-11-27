# Accessibility Implementation Guide

## Overview

This guide documents the accessibility features implemented in the Marketplace Platform to ensure WCAG 2.1 Level AA compliance and provide an inclusive experience for all users.

## What is Web Accessibility?

Web accessibility means that websites, tools, and technologies are designed and developed so that people with disabilities can use them. This includes people with:

- **Visual impairments** (blindness, low vision, color blindness)
- **Hearing impairments** (deafness, hard of hearing)
- **Motor impairments** (difficulty using a mouse, tremors)
- **Cognitive impairments** (learning disabilities, memory issues)

## WCAG 2.1 Guidelines

The Web Content Accessibility Guidelines (WCAG) are organized around four principles (POUR):

### 1. Perceivable
Information and user interface components must be presentable to users in ways they can perceive.
- Provide text alternatives for non-text content
- Provide captions and alternatives for multimedia
- Create content that can be presented in different ways
- Make it easier for users to see and hear content

### 2. Operable
User interface components and navigation must be operable.
- Make all functionality available from a keyboard
- Give users enough time to read and use content
- Do not design content that causes seizures
- Help users navigate and find content

### 3. Understandable
Information and the operation of user interface must be understandable.
- Make text readable and understandable
- Make content appear and operate in predictable ways
- Help users avoid and correct mistakes

### 4. Robust
Content must be robust enough to be interpreted by a wide variety of user agents, including assistive technologies.
- Maximize compatibility with current and future user tools

## Accessibility Features Implemented

### 1. ARIA Labels and Roles

**What are ARIA attributes?**
ARIA (Accessible Rich Internet Applications) attributes provide additional context to assistive technologies about the purpose and state of elements.

**Common ARIA attributes:**
- `aria-label`: Provides a label when visible text isn't available
- `aria-labelledby`: References another element that labels this one
- `aria-describedby`: References another element that describes this one
- `aria-live`: Announces dynamic content changes
- `aria-hidden`: Hides decorative elements from screen readers
- `role`: Defines the purpose of an element

**Examples in our codebase:**

```tsx
// Button with icon only - needs aria-label
<button aria-label="Close modal" onClick={onClose}>
  <XIcon />
</button>

// Loading spinner - announces to screen readers
<div role="status" aria-live="polite" aria-label="Loading content">
  <Spinner />
</div>

// Decorative icon - hidden from screen readers
<span aria-hidden="true">🎨</span>

// Error message - announces immediately
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

### 2. Keyboard Navigation

**Why keyboard navigation matters:**
Many users cannot use a mouse due to motor disabilities, and power users prefer keyboard shortcuts for efficiency.

**Keyboard navigation requirements:**
- All interactive elements must be reachable via Tab key
- Tab order must be logical (top to bottom, left to right)
- Enter/Space must activate buttons and links
- Escape must close modals and dropdowns
- Arrow keys should navigate within components (menus, tabs)

**Focus indicators:**
- All focusable elements must have visible focus indicators
- Focus indicators must have sufficient contrast (3:1 ratio)
- Focus must be visible at all times (no outline: none without replacement)

**Implementation:**
```css
/* Good focus indicator */
button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Never do this without a replacement */
button:focus {
  outline: none; /* ❌ BAD - removes focus indicator */
}
```

### 3. Semantic HTML

**Why semantic HTML matters:**
Screen readers and other assistive technologies rely on proper HTML structure to understand and navigate content.

**Semantic elements to use:**
- `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>` for page structure
- `<h1>` through `<h6>` for headings (in order, no skipping levels)
- `<button>` for actions, `<a>` for navigation
- `<form>`, `<label>`, `<input>` for forms
- `<ul>`, `<ol>`, `<li>` for lists
- `<table>`, `<th>`, `<td>` for tabular data

**Examples:**

```tsx
// ✅ GOOD - Semantic HTML
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/search">Search</a></li>
  </ul>
</nav>

<main>
  <h1>Search Results</h1>
  <section aria-label="Filters">
    <h2>Filter Options</h2>
    {/* Filter content */}
  </section>
  <section aria-label="Results">
    <h2>Listings</h2>
    {/* Listing cards */}
  </section>
</main>

// ❌ BAD - Non-semantic HTML
<div class="nav">
  <div class="link">Home</div>
  <div class="link">Search</div>
</div>

<div class="content">
  <div class="title">Search Results</div>
  {/* Content */}
</div>
```

### 4. Form Accessibility

**Form requirements:**
- Every input must have an associated label
- Labels must be visible (not just placeholder text)
- Error messages must be announced to screen readers
- Required fields must be indicated
- Form validation must be accessible

**Implementation:**

```tsx
// ✅ GOOD - Accessible form input
<div>
  <label htmlFor="email">
    Email Address
    {required && <span aria-label="required">*</span>}
  </label>
  <input
    id="email"
    type="email"
    aria-invalid={hasError}
    aria-describedby={hasError ? "email-error" : undefined}
    required={required}
  />
  {hasError && (
    <div id="email-error" role="alert">
      {errorMessage}
    </div>
  )}
</div>

// ❌ BAD - Inaccessible form input
<input type="email" placeholder="Email" />
```

### 5. Skip Links

**What are skip links?**
Skip links allow keyboard users to bypass repetitive navigation and jump directly to main content.

**Implementation:**
```tsx
// Skip link component (hidden until focused)
<a href="#main-content" className="skip-link">
  Skip to main content
</a>

// CSS for skip link
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-primary);
  color: white;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

### 6. Color Contrast

**WCAG Requirements:**
- Normal text: 4.5:1 contrast ratio
- Large text (18pt+ or 14pt+ bold): 3:1 contrast ratio
- UI components and graphics: 3:1 contrast ratio

**Tools for checking contrast:**
- Chrome DevTools (Lighthouse audit)
- WebAIM Contrast Checker
- Contrast Ratio by Lea Verou

### 7. Images and Alt Text

**Alt text guidelines:**
- Describe the content and function of the image
- Keep it concise (under 125 characters)
- Don't start with "Image of" or "Picture of"
- Decorative images should have empty alt text: `alt=""`
- Complex images (charts, diagrams) need longer descriptions

**Examples:**

```tsx
// ✅ GOOD - Descriptive alt text
<img src="laptop.jpg" alt="Silver laptop on wooden desk" />

// ✅ GOOD - Decorative image
<img src="divider.png" alt="" aria-hidden="true" />

// ✅ GOOD - Functional image (button)
<button>
  <img src="search.svg" alt="Search" />
</button>

// ❌ BAD - Missing or poor alt text
<img src="laptop.jpg" alt="image123" />
<img src="laptop.jpg" /> {/* Missing alt */}
```

### 8. Dynamic Content

**Announcing changes to screen readers:**
Use `aria-live` regions to announce dynamic content changes.

**aria-live values:**
- `off`: Changes are not announced (default)
- `polite`: Changes are announced when user is idle
- `assertive`: Changes are announced immediately

**Examples:**

```tsx
// Loading state - polite announcement
<div role="status" aria-live="polite">
  Loading search results...
</div>

// Error message - immediate announcement
<div role="alert" aria-live="assertive">
  Error: Failed to save listing
</div>

// Search results count - polite announcement
<div aria-live="polite" aria-atomic="true">
  Found {count} listings
</div>
```

## Testing Accessibility

### Automated Testing

**Tools:**
1. **Lighthouse** (Chrome DevTools)
   - Run: DevTools > Lighthouse > Accessibility
   - Checks: ARIA, contrast, labels, etc.

2. **axe DevTools** (Browser extension)
   - More comprehensive than Lighthouse
   - Provides detailed remediation guidance

3. **WAVE** (Browser extension)
   - Visual feedback on accessibility issues
   - Shows ARIA landmarks and structure

### Manual Testing

**Keyboard Navigation Test:**
1. Unplug your mouse
2. Use Tab to navigate through the page
3. Verify all interactive elements are reachable
4. Verify focus indicators are visible
5. Use Enter/Space to activate elements
6. Use Escape to close modals/dropdowns

**Screen Reader Test:**
1. **Windows:** NVDA (free) or JAWS
2. **Mac:** VoiceOver (built-in, Cmd+F5)
3. **Mobile:** TalkBack (Android) or VoiceOver (iOS)

**Test checklist:**
- [ ] Can you navigate the entire page?
- [ ] Are headings announced correctly?
- [ ] Are form labels read with inputs?
- [ ] Are error messages announced?
- [ ] Are images described appropriately?
- [ ] Are buttons and links clearly identified?

### Color Contrast Test

1. Use browser DevTools to check contrast ratios
2. Test with color blindness simulators
3. View site in grayscale to check contrast

## Common Accessibility Mistakes to Avoid

### 1. Using divs/spans as buttons
```tsx
// ❌ BAD
<div onClick={handleClick}>Click me</div>

// ✅ GOOD
<button onClick={handleClick}>Click me</button>
```

### 2. Removing focus indicators
```css
/* ❌ BAD */
*:focus {
  outline: none;
}

/* ✅ GOOD */
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### 3. Using placeholder as label
```tsx
// ❌ BAD
<input type="email" placeholder="Email" />

// ✅ GOOD
<label htmlFor="email">Email</label>
<input id="email" type="email" placeholder="you@example.com" />
```

### 4. Poor color contrast
```css
/* ❌ BAD - Insufficient contrast */
.text {
  color: #999;
  background: #fff;
}

/* ✅ GOOD - Sufficient contrast */
.text {
  color: #666;
  background: #fff;
}
```

### 5. Missing alt text
```tsx
// ❌ BAD
<img src="product.jpg" />

// ✅ GOOD
<img src="product.jpg" alt="Blue ceramic vase" />
```

### 6. Inaccessible modals
```tsx
// ❌ BAD - No focus trap, no keyboard support
<div className="modal">
  <div onClick={onClose}>×</div>
  {content}
</div>

// ✅ GOOD - Proper modal
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
  <button onClick={onClose} aria-label="Close modal">
    ×
  </button>
  <h2 id="modal-title">{title}</h2>
  {content}
</div>
```

## Resources

### Official Guidelines
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### Testing Tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Learning Resources
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

## Checklist for New Features

When adding new features, ensure:

- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] ARIA labels are provided where needed
- [ ] Semantic HTML is used
- [ ] Color contrast meets WCAG AA standards
- [ ] Images have appropriate alt text
- [ ] Forms have proper labels and error handling
- [ ] Dynamic content changes are announced
- [ ] Tested with keyboard only
- [ ] Tested with screen reader
- [ ] Automated accessibility tests pass

## Conclusion

Accessibility is not a feature - it's a fundamental requirement. By following these guidelines, we ensure that the Marketplace Platform is usable by everyone, regardless of their abilities or the technologies they use to access the web.
