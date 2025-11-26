# My Listings Page - Visual Guide

## Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  My Listings                    [Create New Listing]        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [Image]  │ Vintage Camera              [Active]      │  │
│  │          │ Classic film camera in...                 │  │
│  │          │ $150  electronics  Item                   │  │
│  │          │ Posted: 1/14/2024                         │  │
│  │          │                                           │  │
│  │          │                    [Edit]                 │  │
│  │          │                    [Mark as Sold]         │  │
│  │          │                    [Delete]               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [No Img] │ Web Development Service     [Sold]        │  │
│  │          │ Professional web...                       │  │
│  │          │ $75/hr  services  Service                 │  │
│  │          │ Posted: 1/9/2024                          │  │
│  │          │                                           │  │
│  │          │                    [Edit]                 │  │
│  │          │                    [Mark as Active]       │  │
│  │          │                    [Delete]               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Delete Confirmation Modal

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│     ┌───────────────────────────────────────────────┐      │
│     │  Delete Listing                          [X]  │      │
│     ├───────────────────────────────────────────────┤      │
│     │                                               │      │
│     │  Are you sure you want to delete              │      │
│     │  "Vintage Camera"?                            │      │
│     │                                               │      │
│     │  ⚠️ This action cannot be undone. The         │      │
│     │  listing will be permanently removed.         │      │
│     │                                               │      │
│     │                    [Cancel] [Delete Listing]  │      │
│     └───────────────────────────────────────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Empty State

```
┌─────────────────────────────────────────────────────────────┐
│  My Listings                    [Create New Listing]        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │                  No Listings Yet                      │  │
│  │                                                       │  │
│  │  You haven't created any listings yet. Create your   │  │
│  │  first listing to get started!                       │  │
│  │                                                       │  │
│  │           [Create Your First Listing]                │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Loading State

```
┌─────────────────────────────────────────────────────────────┐
│  My Listings                    [Create New Listing]        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │                      ⟳                                │  │
│  │                                                       │  │
│  │              Loading your listings...                │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Mobile Layout (< 768px)

```
┌─────────────────────────┐
│  My Listings            │
│  [Create New Listing]   │
├─────────────────────────┤
│                         │
│  ┌───────────────────┐ │
│  │                   │ │
│  │     [Image]       │ │
│  │                   │ │
│  ├───────────────────┤ │
│  │ Vintage Camera    │ │
│  │ [Active]          │ │
│  │                   │ │
│  │ Classic film...   │ │
│  │                   │ │
│  │ $150              │ │
│  │ electronics       │ │
│  │ Item              │ │
│  │                   │ │
│  │ Posted: 1/14/2024 │ │
│  │                   │ │
│  │ [Edit]            │ │
│  │ [Mark as Sold]    │ │
│  │ [Delete]          │ │
│  └───────────────────┘ │
│                         │
└─────────────────────────┘
```

## Status Badge Colors

- **Active** (Green): `background: var(--color-success)`
- **Sold** (Gray): `background: var(--color-text-secondary)`

## Button Styles

- **Edit** (Secondary): Gray border, hover effect
- **Mark as Sold/Active** (Secondary): Gray border, hover effect
- **Delete** (Danger): Red border, red text, red background on hover
- **Confirm Delete** (Danger): Red background, white text

## Interactive States

### Listing Card Hover
```
┌──────────────────────────────────────────────────────┐
│ [Image]  │ Vintage Camera              [Active]      │
│          │ Classic film camera in...                 │
│          │ $150  electronics  Item                   │
│          │ Posted: 1/14/2024                         │
│          │                                           │
│          │                    [Edit] ← hover         │
│          │                    [Mark as Sold]         │
│          │                    [Delete]               │
└──────────────────────────────────────────────────────┘
     ↑ Shadow increases on hover
```

### Button States

**Edit Button:**
- Default: Gray border, gray text
- Hover: Darker gray background
- Click: Navigate to edit page

**Mark as Sold Button:**
- Default: Gray border, gray text
- Hover: Darker gray background
- Loading: "Updating..." text, disabled
- Click: Updates status, shows loading state

**Delete Button:**
- Default: Red border, red text
- Hover: Red background, white text
- Click: Opens confirmation modal

## User Flow Diagram

```
Start
  │
  ├─→ Load Page
  │     │
  │     ├─→ Show Loading State
  │     │
  │     ├─→ Fetch Listings
  │     │     │
  │     │     ├─→ Success: Display Listings
  │     │     │
  │     │     └─→ Error: Show Error Message
  │     │
  │     └─→ No Listings: Show Empty State
  │
  ├─→ Click Edit
  │     │
  │     └─→ Navigate to /listings/:id/edit
  │
  ├─→ Click Mark as Sold
  │     │
  │     ├─→ Show "Updating..." on button
  │     │
  │     ├─→ Call API
  │     │     │
  │     │     ├─→ Success: Update UI, show "Sold" badge
  │     │     │
  │     │     └─→ Error: Show error alert
  │     │
  │     └─→ Re-enable button
  │
  ├─→ Click Delete
  │     │
  │     ├─→ Show Confirmation Modal
  │     │     │
  │     │     ├─→ Click Cancel: Close Modal
  │     │     │
  │     │     └─→ Click Confirm
  │     │           │
  │     │           ├─→ Show "Deleting..." on button
  │     │           │
  │     │           ├─→ Call API
  │     │           │     │
  │     │           │     ├─→ Success: Remove from list, close modal
  │     │           │     │
  │     │           │     └─→ Error: Show error alert
  │     │           │
  │     │           └─→ Re-enable button
  │     │
  │     └─→ End
  │
  └─→ Click Create New Listing
        │
        └─→ Navigate to /listings/create
```

## Responsive Breakpoints

### Desktop (> 1024px)
- Listing cards: 3-column grid layout
- Action buttons: Vertical stack on right
- Full-width images

### Tablet (768px - 1024px)
- Listing cards: 2-column grid layout
- Action buttons: Horizontal row
- Adjusted image sizes

### Mobile (< 768px)
- Listing cards: Single column
- Action buttons: Vertical stack, full width
- Stacked layout (image on top, details below)

## Accessibility Features

- ✅ Semantic HTML (buttons, headings, lists)
- ✅ ARIA labels on modal
- ✅ Keyboard navigation support
- ✅ Focus management in modal
- ✅ Screen reader friendly status badges
- ✅ Clear button labels
- ✅ Sufficient color contrast

## Performance Optimizations

- ✅ React Query caching (instant subsequent loads)
- ✅ Optimistic updates (immediate UI feedback)
- ✅ Lazy loading of images
- ✅ Efficient re-renders (React.memo where needed)
- ✅ Debounced mutations

---

This visual guide helps understand the layout, interactions, and user flows of the My Listings page!
