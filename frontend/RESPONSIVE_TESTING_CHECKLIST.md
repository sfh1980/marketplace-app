# Responsive Design Testing Checklist

## Overview

Use this checklist to verify that all pages and components work correctly across different screen sizes. Test on real devices when possible, and use browser DevTools for additional testing.

## How to Test

### Using Browser DevTools

1. Open the application in your browser
2. Press **F12** (Windows) or **Cmd+Option+I** (Mac) to open DevTools
3. Press **Ctrl+Shift+M** (Windows) or **Cmd+Shift+M** (Mac) to toggle device toolbar
4. Select different device presets or enter custom dimensions
5. Test interactions: click, scroll, fill forms, etc.

### Device Presets to Test

- **Mobile**: iPhone SE (375px), iPhone 12 (390px), iPhone 14 Pro Max (430px)
- **Tablet**: iPad (768px), iPad Pro (1024px)
- **Desktop**: 1280px, 1920px

## Testing Checklist

### ✅ General Layout

- [ ] No horizontal scrolling on any page (except intentional, like image galleries)
- [ ] All content is visible and accessible
- [ ] Proper spacing between elements
- [ ] Text is readable without zooming
- [ ] Images scale properly and don't overflow
- [ ] Navigation is accessible on all screen sizes

### ✅ Mobile (< 640px)

#### HomePage
- [ ] Hero section displays correctly
- [ ] Search form is usable (full-width input and button)
- [ ] Category grid shows 2 columns
- [ ] Listing grid shows 1 column
- [ ] All text is readable
- [ ] Buttons are easy to tap (44x44px minimum)

#### SearchPage
- [ ] Filter panel is accessible
- [ ] Listing grid shows 1 column
- [ ] Pagination controls are usable
- [ ] Search results display correctly

#### ListingDetailPage
- [ ] Image gallery works (swipe between images)
- [ ] All listing details are visible
- [ ] Price and title are prominent
- [ ] Seller information is accessible
- [ ] Contact button is easy to tap
- [ ] Layout stacks vertically (no side-by-side)

#### ProfilePage
- [ ] Avatar and username display correctly
- [ ] Profile information stacks vertically
- [ ] Edit button is accessible
- [ ] User's listings display in single column
- [ ] All metadata is visible

#### MessagesInboxPage
- [ ] Conversation list is scrollable
- [ ] Each conversation card is tappable
- [ ] Unread badges are visible
- [ ] Message previews are readable
- [ ] Timestamps display correctly

#### ConversationPage
- [ ] Header shows user info
- [ ] Messages display correctly (sent right, received left)
- [ ] Message input is accessible
- [ ] Send button is easy to tap
- [ ] Keyboard doesn't cover input (test on real device)
- [ ] Messages scroll smoothly

#### CreateListingPage
- [ ] All form fields are accessible
- [ ] Inputs are full-width
- [ ] Radio buttons are easy to tap
- [ ] Image upload works
- [ ] Image previews display correctly
- [ ] Submit button is prominent

#### MyListingsPage
- [ ] Listing cards stack vertically
- [ ] Images display correctly
- [ ] Action buttons are accessible
- [ ] Edit/Delete buttons are easy to tap
- [ ] Status badges are visible

#### LoginPage / RegisterPage
- [ ] Form is centered and readable
- [ ] Inputs are full-width
- [ ] Submit button is prominent
- [ ] Links are tappable
- [ ] Error messages display correctly

### ✅ Tablet (640px - 1023px)

#### HomePage
- [ ] Hero section scales appropriately
- [ ] Category grid shows 3 columns
- [ ] Listing grid shows 2-3 columns
- [ ] Search form displays inline (input + button side by side)

#### SearchPage
- [ ] Filter panel displays as sidebar
- [ ] Listing grid shows 2-3 columns
- [ ] Two-column layout (filters + listings)

#### ListingDetailPage
- [ ] Two-column layout (main content + sidebar)
- [ ] Image gallery displays properly
- [ ] Seller card is in sidebar
- [ ] Contact card is in sidebar

#### ProfilePage
- [ ] Avatar and info display side by side
- [ ] Listings grid shows 2-3 columns
- [ ] Edit button is in header

#### MessagesInboxPage
- [ ] Conversation cards display with proper spacing
- [ ] Avatars are larger
- [ ] More message preview text visible

#### ConversationPage
- [ ] Chat interface uses available width
- [ ] Message bubbles have appropriate max-width

#### CreateListingPage
- [ ] Form fields use available width
- [ ] Image grid shows 3-4 columns
- [ ] Two-column layout for some fields

#### MyListingsPage
- [ ] Listing cards show more information
- [ ] Images are larger
- [ ] Action buttons display inline

### ✅ Desktop (1024px+)

#### HomePage
- [ ] Hero section is full-width with max-width container
- [ ] Category grid shows 6 columns
- [ ] Listing grid shows 3-4 columns
- [ ] Hover effects work on cards

#### SearchPage
- [ ] Filter panel is sticky sidebar
- [ ] Listing grid shows 3-4 columns
- [ ] Pagination is centered

#### ListingDetailPage
- [ ] Two-column layout with proper spacing
- [ ] Image gallery is prominent
- [ ] Seller and contact cards are sticky
- [ ] Hover effects on images

#### ProfilePage
- [ ] Avatar and info display side by side
- [ ] Listings grid shows 3-4 columns
- [ ] Hover effects on listing cards

#### MessagesInboxPage
- [ ] Conversation cards have hover effects
- [ ] Proper spacing and alignment
- [ ] Unread badges are prominent

#### ConversationPage
- [ ] Chat interface is centered with max-width
- [ ] Message bubbles have appropriate max-width (70%)
- [ ] Smooth scrolling

#### CreateListingPage
- [ ] Form is centered with max-width
- [ ] Image grid shows 4-5 columns
- [ ] Proper field grouping

#### MyListingsPage
- [ ] Listing cards show all information
- [ ] Hover effects on cards
- [ ] Action buttons are inline

### ✅ Touch Interactions (Mobile/Tablet)

- [ ] All buttons are at least 44x44px
- [ ] Adequate spacing between tappable elements
- [ ] No accidental taps on nearby elements
- [ ] Swipe gestures work where implemented
- [ ] Pull-to-refresh works (if implemented)
- [ ] Long-press actions work (if implemented)

### ✅ Forms

- [ ] All inputs are accessible
- [ ] Labels are visible and associated with inputs
- [ ] Error messages display clearly
- [ ] Submit buttons are prominent
- [ ] Keyboard navigation works
- [ ] Autocomplete works
- [ ] Validation feedback is immediate

### ✅ Navigation

- [ ] Navigation menu is accessible on all screen sizes
- [ ] Mobile menu (hamburger) works if implemented
- [ ] Breadcrumbs display correctly
- [ ] Back buttons work
- [ ] Links are tappable with adequate spacing

### ✅ Images

- [ ] Images load correctly
- [ ] Images scale to container width
- [ ] Aspect ratios are maintained
- [ ] Placeholder images display while loading
- [ ] Image galleries work on mobile (swipe)
- [ ] No broken images

### ✅ Typography

- [ ] All text is readable (minimum 16px on mobile)
- [ ] Headings scale appropriately
- [ ] Line height is comfortable for reading
- [ ] No text overflow or truncation issues
- [ ] Font sizes adjust for screen size

### ✅ Spacing

- [ ] Consistent spacing throughout
- [ ] No elements touching screen edges
- [ ] Adequate padding in containers
- [ ] Proper gaps between grid items
- [ ] Comfortable spacing between sections

### ✅ Performance

- [ ] Pages load quickly on mobile
- [ ] Smooth scrolling
- [ ] No layout shifts during load
- [ ] Images are optimized
- [ ] Animations are smooth (60fps)

### ✅ Accessibility

- [ ] Keyboard navigation works
- [ ] Focus indicators are visible
- [ ] Screen reader compatibility (test with screen reader)
- [ ] Color contrast meets WCAG AA standards
- [ ] Touch targets meet minimum size (44x44px)
- [ ] Reduced motion preference is respected

### ✅ Edge Cases

- [ ] Very long text doesn't break layout
- [ ] Empty states display correctly
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] Very long usernames/titles are truncated
- [ ] Many items in lists/grids display correctly

### ✅ Orientation

- [ ] Portrait orientation works
- [ ] Landscape orientation works (test on mobile/tablet)
- [ ] Layout adjusts appropriately for orientation

### ✅ Browser Compatibility

Test on multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (iOS and macOS)
- [ ] Samsung Internet (Android)

## Common Issues and Solutions

### Issue: Horizontal Scrolling

**Check for:**
- Fixed-width elements wider than viewport
- Images without `max-width: 100%`
- Long unbreakable text (URLs, emails)
- Negative margins pushing content outside viewport

**Solution:**
```css
* {
  box-sizing: border-box;
}

img {
  max-width: 100%;
  height: auto;
}

.container {
  overflow-x: hidden;
}
```

### Issue: Text Too Small

**Check for:**
- Font sizes below 16px on mobile
- Insufficient line height
- Low color contrast

**Solution:**
```css
body {
  font-size: 16px; /* Minimum for mobile */
  line-height: 1.5;
}
```

### Issue: Buttons Too Small to Tap

**Check for:**
- Touch targets smaller than 44x44px
- Insufficient spacing between buttons
- Padding too small

**Solution:**
```css
.button {
  min-height: 44px;
  min-width: 44px;
  padding: var(--space-md);
}
```

### Issue: Layout Breaks on Specific Screen Size

**Check for:**
- Missing media query breakpoint
- Fixed widths instead of flexible layouts
- Grid columns not adjusting

**Solution:**
```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}
```

## Testing Tools

### Browser DevTools
- Chrome DevTools (F12)
- Firefox Developer Tools (F12)
- Safari Web Inspector (Cmd+Option+I)

### Online Tools
- [Responsive Design Checker](https://responsivedesignchecker.com/)
- [BrowserStack](https://www.browserstack.com/) (Real device testing)
- [LambdaTest](https://www.lambdatest.com/) (Cross-browser testing)

### Accessibility Tools
- [WAVE](https://wave.webaim.org/) (Web accessibility evaluation)
- [axe DevTools](https://www.deque.com/axe/devtools/) (Browser extension)
- Screen readers: NVDA (Windows), VoiceOver (Mac/iOS), TalkBack (Android)

## Sign-Off

After completing all tests, sign off on each device category:

- [ ] **Mobile (< 640px)** - Tested and working
- [ ] **Tablet (640px - 1023px)** - Tested and working
- [ ] **Desktop (1024px+)** - Tested and working
- [ ] **Touch Interactions** - Tested and working
- [ ] **Accessibility** - Tested and working
- [ ] **Performance** - Acceptable load times and smooth interactions

**Tester Name:** ___________________________

**Date:** ___________________________

**Notes:** ___________________________
