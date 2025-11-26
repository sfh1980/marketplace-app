# FilterPanel Component - Visual Guide

## Component Layout

```
┌─────────────────────────────────────────┐
│  Filters                      5 active  │  ← Header with active count
├─────────────────────────────────────────┤
│                                         │
│  Category                               │  ← Category dropdown
│  ┌───────────────────────────────────┐ │
│  │ Electronics (42)              ▼   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Listing Type                           │  ← Radio buttons
│  ○ All   ● Items   ○ Services          │
│                                         │
│  Price Range                            │  ← Min/Max inputs
│  ┌──────────┐      ┌──────────┐       │
│  │   50     │  to  │   500    │       │
│  └──────────┘      └──────────┘       │
│                                         │
│  Location                               │  ← Text input
│  ┌───────────────────────────────────┐ │
│  │ New York                          │ │
│  └───────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐ │
│  │      Apply Filters                │ │  ← Primary action
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │      Clear All                    │ │  ← Secondary action
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## SearchPage Layout (Desktop)

```
┌────────────────────────────────────────────────────────────────┐
│  Search Results                                                │
│  Searching for: camera                                         │
│  Found 42 listings                                             │
├────────────────┬───────────────────────────────────────────────┤
│                │                                               │
│  ┌──────────┐ │  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ Filters  │ │  │ Listing │  │ Listing │  │ Listing │      │
│  │          │ │  │  Card   │  │  Card   │  │  Card   │      │
│  │ Category │ │  └─────────┘  └─────────┘  └─────────┘      │
│  │ Type     │ │                                               │
│  │ Price    │ │  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ Location │ │  │ Listing │  │ Listing │  │ Listing │      │
│  │          │ │  │  Card   │  │  Card   │  │  Card   │      │
│  │ [Apply]  │ │  └─────────┘  └─────────┘  └─────────┘      │
│  │ [Clear]  │ │                                               │
│  └──────────┘ │  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│    (sticky)   │  │ Listing │  │ Listing │  │ Listing │      │
│               │  │  Card   │  │  Card   │  │  Card   │      │
│               │  └─────────┘  └─────────┘  └─────────┘      │
│               │                                               │
│               │  ← Previous   Page 1 of 3   Next →           │
│               │                                               │
└───────────────┴───────────────────────────────────────────────┘
   280px fixed      Flexible width (grows to fill space)
```

## SearchPage Layout (Mobile)

```
┌──────────────────────────────┐
│  Search Results              │
│  Searching for: camera       │
│  Found 42 listings           │
├──────────────────────────────┤
│  ┌────────────────────────┐ │
│  │ Filters                │ │  ← Filters on top
│  │                        │ │
│  │ Category: Electronics  │ │
│  │ Type: Items            │ │
│  │ Price: $50 - $500      │ │
│  │ Location: New York     │ │
│  │                        │ │
│  │ [Apply] [Clear]        │ │
│  └────────────────────────┘ │
├──────────────────────────────┤
│  ┌────────────────────────┐ │
│  │ Listing Card           │ │  ← Single column
│  └────────────────────────┘ │
│  ┌────────────────────────┐ │
│  │ Listing Card           │ │
│  └────────────────────────┘ │
│  ┌────────────────────────┐ │
│  │ Listing Card           │ │
│  └────────────────────────┘ │
│                              │
│  ← Prev  Page 1 of 3  Next →│
└──────────────────────────────┘
```

## Filter States

### No Filters Active
```
┌─────────────────────────────┐
│  Filters                    │  ← No badge
├─────────────────────────────┤
│  Category: All Categories   │
│  Type: ○ All                │
│  Price: [empty] to [empty]  │
│  Location: [empty]          │
├─────────────────────────────┤
│  [Apply Filters]            │  ← Only Apply button
└─────────────────────────────┘
```

### Filters Active
```
┌─────────────────────────────┐
│  Filters          3 active  │  ← Badge shows count
├─────────────────────────────┤
│  Category: Electronics      │  ← Selected
│  Type: ● Items              │  ← Selected
│  Price: 50 to 500           │  ← Filled
│  Location: [empty]          │
├─────────────────────────────┤
│  [Apply Filters]            │
│  [Clear All]                │  ← Clear button appears
└─────────────────────────────┘
```

### Loading Categories
```
┌─────────────────────────────┐
│  Filters                    │
├─────────────────────────────┤
│  Category                   │
│  ┌───────────────────────┐ │
│  │ Loading...        ▼   │ │  ← Disabled while loading
│  └───────────────────────┘ │
│  ...                        │
└─────────────────────────────┘
```

### Category Error
```
┌─────────────────────────────┐
│  Filters                    │
├─────────────────────────────┤
│  Category                   │
│  ┌───────────────────────┐ │
│  │ Error loading     ▼   │ │  ← Error message
│  └───────────────────────┘ │
│  ...                        │
└─────────────────────────────┘
```

## User Flow

### Applying Filters

```
1. User opens search page
   ↓
2. User adjusts filters
   - Select category: "Electronics"
   - Select type: "Items"
   - Enter min price: "50"
   - Enter max price: "500"
   ↓
3. Active count updates: "4 active"
   ↓
4. User clicks "Apply Filters"
   ↓
5. URL updates:
   /search?query=camera&category=electronics&listingType=item&minPrice=50&maxPrice=500&page=1
   ↓
6. SearchPage detects URL change
   ↓
7. New search results load
   ↓
8. Page scrolls to top
```

### Clearing Filters

```
1. User has active filters
   ↓
2. User clicks "Clear All"
   ↓
3. All filter inputs reset
   ↓
4. URL updates (preserves search query):
   /search?query=camera&page=1
   ↓
5. SearchPage detects URL change
   ↓
6. Unfiltered results load
```

### Sharing Filtered Search

```
1. User applies filters
   ↓
2. URL contains all filter parameters:
   /search?query=camera&category=electronics&minPrice=50&maxPrice=500
   ↓
3. User copies URL
   ↓
4. User shares URL with friend
   ↓
5. Friend opens URL
   ↓
6. FilterPanel reads URL parameters
   ↓
7. Form inputs populate with filter values
   ↓
8. Search results match filters
```

## Component Interactions

```
┌─────────────────────────────────────────────────────────────┐
│                        SearchPage                           │
│                                                             │
│  ┌──────────────┐              ┌────────────────────────┐ │
│  │ FilterPanel  │              │   Listings Grid        │ │
│  │              │              │                        │ │
│  │ Reads URL ←──┼──────────────┼─→ Reads URL           │ │
│  │              │              │                        │ │
│  │ User adjusts │              │                        │ │
│  │ filters      │              │                        │ │
│  │              │              │                        │ │
│  │ Clicks Apply │              │                        │ │
│  │      ↓       │              │                        │ │
│  │ Updates URL ─┼──────────────┼─→ Detects URL change  │ │
│  │              │              │      ↓                 │ │
│  │              │              │ Fetches new results    │ │
│  │              │              │      ↓                 │ │
│  │              │              │ Displays results       │ │
│  └──────────────┘              └────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## CSS Grid Layout

### Desktop (≥768px)
```css
.contentLayout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--space-xl);
}

/* Result: */
┌────────┬──────────────────────┐
│ 280px  │  Flexible (1fr)      │
│ Sidebar│  Main Content        │
└────────┴──────────────────────┘
```

### Mobile (<768px)
```css
.contentLayout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-xl);
}

/* Result: */
┌──────────────────────┐
│  Full Width (1fr)    │
│  Sidebar             │
├──────────────────────┤
│  Full Width (1fr)    │
│  Main Content        │
└──────────────────────┘
```

## Accessibility Features

### Keyboard Navigation
```
Tab Order:
1. Category dropdown
2. Listing Type: All radio
3. Listing Type: Items radio
4. Listing Type: Services radio
5. Min Price input
6. Max Price input
7. Location input
8. Apply Filters button
9. Clear All button (if visible)
```

### Screen Reader Announcements
```
"Filters, heading level 2"
"Category, combobox, Electronics selected"
"Listing Type, radio group"
"Items, radio button, checked"
"Price Range, group"
"Min, number input, 50"
"Max, number input, 500"
"Location, text input, New York"
"Apply Filters, button"
"Clear All, button"
"3 active filters"
```

### ARIA Labels
```html
<label for="category">Category</label>
<select id="category" aria-label="Category filter">

<label for="location">Location</label>
<input id="location" aria-label="Location filter">

<div role="group" aria-label="Listing Type">
  <input type="radio" name="listingType" aria-label="All listing types">
  <input type="radio" name="listingType" aria-label="Items only">
  <input type="radio" name="listingType" aria-label="Services only">
</div>
```

## Performance Considerations

### Optimizations
- Categories fetched once on mount (cached)
- Local state prevents URL spam while typing
- Controlled components minimize re-renders
- CSS Modules for scoped styles (no global pollution)
- Sticky positioning uses GPU acceleration

### Bundle Size
- Component: ~5KB (minified)
- CSS: ~2KB (minified)
- No external dependencies (uses existing components)

## Browser Support

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+

**Required Features:**
- CSS Grid
- CSS Flexbox
- Sticky positioning
- CSS Variables
- ES6+ JavaScript
