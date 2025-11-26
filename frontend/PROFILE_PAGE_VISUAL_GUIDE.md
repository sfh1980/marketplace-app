# Profile Page Visual Guide

## Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│                     PROFILE HEADER CARD                      │
│  ┌──────────┐                                               │
│  │          │  Username                                     │
│  │  Avatar  │  Member since: January 2024                   │
│  │          │  Location: San Francisco, CA                  │
│  │          │  Rating: ⭐ 4.5                               │
│  └──────────┘  ✓ Email Verified                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    USERNAME'S LISTINGS                       │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │  Image   │  │  Image   │  │  Image   │                 │
│  │          │  │          │  │          │                 │
│  ├──────────┤  ├──────────┤  ├──────────┤                 │
│  │ Title    │  │ Title    │  │ Title    │                 │
│  │ $150.00  │  │ $75/hr   │  │ $200.00  │                 │
│  │ 📦 Item  │  │ 🛠️ Service│  │ 📦 Item  │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
│                                                              │
│  ┌──────────┐  ┌──────────┐                                │
│  │  Image   │  │  Image   │                                │
│  │          │  │          │                                │
│  ├──────────┤  ├──────────┤                                │
│  │ Title    │  │ Title    │                                │
│  │ $50.00   │  │ $100.00  │                                │
│  │ 📦 Item  │  │ 📦 Item  │                                │
│  └──────────┘  └──────────┘                                │
└─────────────────────────────────────────────────────────────┘
```

## States

### Loading State
```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                         ⟳ Spinner                           │
│                    Loading profile...                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│              Unable to Load Profile                          │
│                                                              │
│         User not found or network error occurred             │
│                                                              │
│         [Try Again]  [Go to Home]                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Empty Listings State
```
┌─────────────────────────────────────────────────────────────┐
│                    USERNAME'S LISTINGS                       │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │      Username hasn't posted any listings yet.       │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Responsive Behavior

### Desktop (1024px+)
- Profile header: Avatar on left, info on right
- Listings: 3-4 columns grid
- Full spacing and padding

### Tablet (768px - 1023px)
- Profile header: Avatar on left, info on right
- Listings: 2-3 columns grid
- Reduced spacing

### Mobile (< 768px)
- Profile header: Avatar centered above info
- Listings: Single column
- Compact spacing
- Full-width buttons

## Interactive Elements

### Clickable Listing Cards
- Hover effect: Slight lift and shadow
- Cursor changes to pointer
- Click navigates to `/listings/:listingId`

### Error State Buttons
- "Try Again": Reloads the page
- "Go to Home": Navigates to homepage

## Color Scheme

### Profile Header
- Background: Elevated card (white with shadow)
- Username: Primary text color
- Metadata labels: Secondary text color
- Metadata values: Primary text color (semibold)
- Verified badge: Success green background

### Listings
- Card background: White with border
- Title: Primary text color
- Price: Primary brand color (blue)
- Type badge: Light gray background
- Status badge: Warning yellow background

### Loading State
- Spinner: Primary brand color
- Text: Secondary text color

### Error State
- Title: Error red color
- Text: Secondary text color
- Buttons: Primary and secondary variants

## Typography

### Profile Section
- Username: 2rem (32px), bold
- Metadata labels: 0.875rem (14px), medium weight
- Metadata values: 1rem (16px), semibold

### Listings Section
- Section title: 1.5rem (24px), bold
- Listing title: 1.125rem (18px), semibold
- Listing price: 1.25rem (20px), bold
- Badges: 0.875rem (14px), medium weight

## Spacing

- Container max-width: 1024px
- Container padding: 32px (desktop), 16px (mobile)
- Profile card margin-bottom: 32px
- Listings grid gap: 24px (desktop), 16px (mobile)
- Card padding: 16px

## Avatar Behavior

### With Profile Picture
- Displays user's uploaded image
- Circular shape (120px diameter)
- Border: 3px solid border color
- Object-fit: cover (maintains aspect ratio)

### Without Profile Picture
- Gradient background (primary to secondary color)
- First letter of username in white
- Large font size (40px)
- Same circular shape and border

## Listing Card Details

### Image Section
- Fixed height: 200px
- Full width
- Object-fit: cover
- Rounded top corners
- Gray background if no image

### Content Section
- Title: Truncates with ellipsis if too long
- Price: Bold, primary color
- Hourly rate: Shows "/hr" suffix
- Type badge: Icon + text (📦 Item or 🛠️ Service)
- Status badge: Only shown for non-active listings

## Accessibility Features

- Semantic HTML structure
- Alt text for images
- Keyboard navigation support
- Screen reader friendly
- Focus indicators on interactive elements
- ARIA labels where appropriate

## Performance Optimizations

- Lazy loading of images
- React Query caching
- Separate queries for profile and listings
- Optimized re-renders with React.memo (if needed)
- CSS animations use transform (GPU accelerated)
