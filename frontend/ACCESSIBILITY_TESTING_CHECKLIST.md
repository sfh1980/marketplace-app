# Accessibility Testing Checklist

Use this checklist to verify accessibility compliance before deploying new features.

## Automated Testing

### Lighthouse Audit
- [ ] Run Lighthouse accessibility audit in Chrome DevTools
- [ ] Score is 90 or above
- [ ] All critical issues are resolved
- [ ] Review and address warnings

**How to run:**
1. Open Chrome DevTools (F12)
2. Go to Lighthouse tab
3. Select "Accessibility" category
4. Click "Generate report"

### axe DevTools
- [ ] Install axe DevTools browser extension
- [ ] Run scan on each major page
- [ ] Fix all violations
- [ ] Review and address incomplete items

**How to run:**
1. Install axe DevTools extension
2. Open DevTools and go to axe DevTools tab
3. Click "Scan ALL of my page"
4. Review and fix issues

## Keyboard Navigation Testing

### General Navigation
- [ ] Tab key moves focus through all interactive elements
- [ ] Tab order is logical (top to bottom, left to right)
- [ ] Focus indicators are clearly visible
- [ ] Shift+Tab moves focus backwards
- [ ] No keyboard traps (can always move focus away)

### Skip Links
- [ ] Skip link appears when Tab is pressed
- [ ] Skip link moves focus to main content
- [ ] Skip link is visually prominent

### Forms
- [ ] All form inputs are reachable via Tab
- [ ] Enter submits forms
- [ ] Escape clears/cancels forms where appropriate
- [ ] Radio buttons navigable with arrow keys
- [ ] Checkboxes toggle with Space
- [ ] Select dropdowns open with Space/Enter
- [ ] Select options navigable with arrow keys

### Buttons and Links
- [ ] All buttons activate with Enter or Space
- [ ] All links activate with Enter
- [ ] Button/link purpose is clear from focus

### Modals and Dialogs
- [ ] Focus moves to modal when opened
- [ ] Focus is trapped within modal
- [ ] Escape closes modal
- [ ] Focus returns to trigger element when closed
- [ ] Background content is inert (not focusable)

### Menus and Dropdowns
- [ ] Enter/Space opens menu
- [ ] Arrow keys navigate menu items
- [ ] Escape closes menu
- [ ] Tab moves to next element (closes menu)

### Image Galleries
- [ ] Arrow keys navigate between images
- [ ] Enter/Space activates image
- [ ] Escape closes fullscreen view

## Screen Reader Testing

### Windows (NVDA - Free)
- [ ] Download and install NVDA
- [ ] Navigate entire site with screen reader
- [ ] All content is announced
- [ ] Headings are announced correctly
- [ ] Links and buttons are identified
- [ ] Form labels are read with inputs
- [ ] Error messages are announced
- [ ] Dynamic content changes are announced

**NVDA Keyboard Shortcuts:**
- Ctrl: Stop reading
- Insert+Down Arrow: Read next line
- Insert+Up Arrow: Read previous line
- H: Next heading
- K: Next link
- B: Next button
- F: Next form field

### Mac (VoiceOver - Built-in)
- [ ] Enable VoiceOver (Cmd+F5)
- [ ] Navigate entire site with screen reader
- [ ] All content is announced
- [ ] Headings are announced correctly
- [ ] Links and buttons are identified
- [ ] Form labels are read with inputs
- [ ] Error messages are announced
- [ ] Dynamic content changes are announced

**VoiceOver Keyboard Shortcuts:**
- VO = Ctrl+Option
- VO+A: Start reading
- VO+Right Arrow: Next item
- VO+Left Arrow: Previous item
- VO+H: Next heading
- VO+L: Next link
- VO+J: Next form control

## Visual Testing

### Color Contrast
- [ ] Text has 4.5:1 contrast ratio (normal text)
- [ ] Large text has 3:1 contrast ratio (18pt+ or 14pt+ bold)
- [ ] UI components have 3:1 contrast ratio
- [ ] Focus indicators have 3:1 contrast ratio
- [ ] Test with WebAIM Contrast Checker

### Color Blindness
- [ ] Test with color blindness simulator
- [ ] Information not conveyed by color alone
- [ ] Error states use icons, not just red color
- [ ] Success states use icons, not just green color

**Tools:**
- Chrome DevTools > Rendering > Emulate vision deficiencies
- Colorblind Web Page Filter extension

### Zoom and Text Scaling
- [ ] Page works at 200% zoom
- [ ] Page works at 400% zoom (WCAG AAA)
- [ ] No horizontal scrolling at 200% zoom
- [ ] Text doesn't overlap or get cut off
- [ ] All functionality remains available

**How to test:**
- Chrome: Ctrl/Cmd + Plus/Minus
- Browser settings > Appearance > Font size

## Semantic HTML Testing

### Document Structure
- [ ] One `<h1>` per page
- [ ] Heading hierarchy is logical (no skipped levels)
- [ ] Landmarks are used (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`)
- [ ] Lists use `<ul>`, `<ol>`, `<li>` elements
- [ ] Tables use `<table>`, `<th>`, `<td>` elements

### Forms
- [ ] All inputs have associated `<label>` elements
- [ ] Labels use `for` attribute matching input `id`
- [ ] Required fields are marked with `required` attribute
- [ ] Error messages use `aria-describedby`
- [ ] Fieldsets group related inputs
- [ ] Legends describe fieldset purpose

### Buttons and Links
- [ ] Buttons use `<button>` element
- [ ] Links use `<a>` element
- [ ] Buttons perform actions
- [ ] Links navigate to new pages/sections
- [ ] No `<div>` or `<span>` used as buttons

## ARIA Testing

### ARIA Labels
- [ ] Icon-only buttons have `aria-label`
- [ ] Complex widgets have `aria-label` or `aria-labelledby`
- [ ] Decorative images have `aria-hidden="true"`
- [ ] Form errors have `aria-invalid` and `aria-describedby`

### ARIA Live Regions
- [ ] Loading states use `role="status"` and `aria-live="polite"`
- [ ] Error messages use `role="alert"` and `aria-live="assertive"`
- [ ] Search results count uses `aria-live="polite"`
- [ ] Dynamic content changes are announced

### ARIA Roles
- [ ] Modals use `role="dialog"` and `aria-modal="true"`
- [ ] Navigation uses `role="navigation"` or `<nav>`
- [ ] Search uses `role="search"`
- [ ] Tabs use `role="tablist"`, `role="tab"`, `role="tabpanel"`
- [ ] Custom widgets have appropriate roles

## Mobile Accessibility

### Touch Targets
- [ ] All interactive elements are at least 44x44 pixels
- [ ] Adequate spacing between touch targets
- [ ] No overlapping touch targets

### Mobile Screen Readers
- [ ] Test with TalkBack (Android)
- [ ] Test with VoiceOver (iOS)
- [ ] All gestures work with screen reader
- [ ] All content is accessible

### Orientation
- [ ] App works in portrait mode
- [ ] App works in landscape mode
- [ ] No content is lost when rotating

## Content Testing

### Images
- [ ] All images have `alt` attributes
- [ ] Alt text is descriptive and concise
- [ ] Decorative images have empty alt (`alt=""`)
- [ ] Complex images have longer descriptions
- [ ] Icons have appropriate labels

### Videos and Audio
- [ ] Videos have captions
- [ ] Audio has transcripts
- [ ] Media players are keyboard accessible
- [ ] Play/pause controls are accessible

### Links
- [ ] Link text is descriptive (not "click here")
- [ ] Link purpose is clear from text alone
- [ ] External links are indicated
- [ ] Links that open new windows are indicated

## Page-Specific Checklists

### Homepage
- [ ] Skip link works
- [ ] Search bar is accessible
- [ ] Category links are keyboard accessible
- [ ] Featured listings are accessible
- [ ] All images have alt text

### Search Results Page
- [ ] Filter panel is keyboard accessible
- [ ] Search results are announced
- [ ] Pagination is keyboard accessible
- [ ] Listing cards are keyboard accessible
- [ ] No results state is accessible

### Listing Detail Page
- [ ] Image gallery is keyboard accessible
- [ ] Contact seller button is accessible
- [ ] All listing information is accessible
- [ ] Breadcrumbs are accessible

### Forms (Create Listing, Register, etc.)
- [ ] All inputs have labels
- [ ] Required fields are indicated
- [ ] Error messages are accessible
- [ ] Success messages are accessible
- [ ] File upload is accessible

### Messages/Inbox
- [ ] Conversation list is keyboard accessible
- [ ] Message thread is accessible
- [ ] Send message form is accessible
- [ ] Timestamps are accessible

## Documentation

- [ ] Accessibility features are documented
- [ ] Known issues are documented
- [ ] Remediation plans are documented
- [ ] Testing procedures are documented

## Compliance Verification

- [ ] WCAG 2.1 Level A compliance
- [ ] WCAG 2.1 Level AA compliance
- [ ] Section 508 compliance (if applicable)
- [ ] ADA compliance (if applicable)

## Notes

**Testing Frequency:**
- Run automated tests on every build
- Manual keyboard testing for new features
- Screen reader testing for major releases
- Full accessibility audit quarterly

**Priority Levels:**
- Critical: Blocks core functionality (fix immediately)
- High: Significant barrier (fix within sprint)
- Medium: Usability issue (fix within month)
- Low: Enhancement (backlog)

**Resources:**
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM](https://webaim.org/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

## Sign-off

- [ ] Developer tested
- [ ] QA tested
- [ ] Accessibility specialist reviewed (if available)
- [ ] Product owner approved

---

**Last Updated:** [Date]
**Tested By:** [Name]
**Issues Found:** [Number]
**Issues Resolved:** [Number]
