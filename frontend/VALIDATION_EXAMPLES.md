# Form Validation Feedback Examples

## Visual Examples of Validation States

This document shows examples of how form validation feedback appears to users.

## 1. Empty Form (Submit Button Disabled)

When a user first sees a form, required fields are empty and the submit button is disabled:

```
┌─────────────────────────────────────────┐
│  Create New Listing                     │
├─────────────────────────────────────────┤
│                                         │
│  Title *                                │
│  ┌───────────────────────────────────┐ │
│  │                                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Description *                          │
│  ┌───────────────────────────────────┐ │
│  │                                   │ │
│  │                                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Price *                                │
│  ┌───────────────────────────────────┐ │
│  │                                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Create Listing (DISABLED)      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Please fill in all required fields    │
│  to create your listing                │
└─────────────────────────────────────────┘
```

**User Experience:**
- Submit button is grayed out (disabled)
- Hint message explains why button is disabled
- User knows they need to fill in fields

## 2. Invalid Email (Error State)

When a user enters an invalid email and leaves the field:

```
┌─────────────────────────────────────────┐
│  Sign In                                │
├─────────────────────────────────────────┤
│                                         │
│  Email Address *                        │
│  ┌───────────────────────────────────┐ │
│  │ invalid-email        [X]          │ │ ← Red border + error icon
│  └───────────────────────────────────┘ │
│  ⚠ Please enter a valid email address  │ ← Error message in red
│                                         │
│  Password *                             │
│  ┌───────────────────────────────────┐ │
│  │ ••••••••                          │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Sign In (DISABLED)             │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**User Experience:**
- Red border around invalid field
- Error icon (X) in the field
- Specific error message below field
- Submit button remains disabled
- User knows exactly what to fix

## 3. Valid Email (Success State)

When a user enters a valid email:

```
┌─────────────────────────────────────────┐
│  Sign In                                │
├─────────────────────────────────────────┤
│                                         │
│  Email Address *                        │
│  ┌───────────────────────────────────┐ │
│  │ user@example.com     [✓]          │ │ ← Green border + checkmark
│  └───────────────────────────────────┘ │
│                                         │
│  Password *                             │
│  ┌───────────────────────────────────┐ │
│  │ ••••••••                          │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Sign In (DISABLED)             │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**User Experience:**
- Green border around valid field
- Checkmark icon confirms validity
- No error message
- Submit button still disabled (password needed)
- User gets positive feedback

## 4. All Fields Valid (Submit Button Enabled)

When all required fields are valid:

```
┌─────────────────────────────────────────┐
│  Sign In                                │
├─────────────────────────────────────────┤
│                                         │
│  Email Address *                        │
│  ┌───────────────────────────────────┐ │
│  │ user@example.com     [✓]          │ │ ← Green border + checkmark
│  └───────────────────────────────────┘ │
│                                         │
│  Password *                             │
│  ┌───────────────────────────────────┐ │
│  │ ••••••••             [✓]          │ │ ← Green border + checkmark
│  └───────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Sign In (ENABLED)              │   │ ← Blue button, clickable
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**User Experience:**
- All fields show success state
- Submit button is enabled (blue, clickable)
- User can submit the form
- Clear visual feedback that form is ready

## 5. Password Strength Validation

When a user enters a weak password:

```
┌─────────────────────────────────────────┐
│  Create Account                         │
├─────────────────────────────────────────┤
│                                         │
│  Password *                             │
│  ┌───────────────────────────────────┐ │
│  │ password         [X]              │ │ ← Red border + error icon
│  └───────────────────────────────────┘ │
│  ⚠ Password must include uppercase,    │
│     lowercase, and number               │
│  At least 8 characters with uppercase, │
│  lowercase, and number                  │
│                                         │
│  Confirm Password *                     │
│  ┌───────────────────────────────────┐ │
│  │                                   │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**User Experience:**
- Error message explains requirements
- Helper text provides guidance
- User knows exactly what's needed
- Can fix password before moving on

## 6. Password Mismatch

When passwords don't match:

```
┌─────────────────────────────────────────┐
│  Create Account                         │
├─────────────────────────────────────────┤
│                                         │
│  Password *                             │
│  ┌───────────────────────────────────┐ │
│  │ ••••••••             [✓]          │ │ ← Valid password
│  └───────────────────────────────────┘ │
│                                         │
│  Confirm Password *                     │
│  ┌───────────────────────────────────┐ │
│  │ ••••••••             [X]          │ │ ← Red border + error icon
│  └───────────────────────────────────┘ │
│  ⚠ Passwords do not match              │
└─────────────────────────────────────────┘
```

**User Experience:**
- First password shows success
- Confirmation shows error
- Clear message about mismatch
- User knows to re-enter confirmation

## 7. File Upload Validation

When a user tries to upload an invalid file:

```
┌─────────────────────────────────────────┐
│  Create Listing                         │
├─────────────────────────────────────────┤
│                                         │
│  Images * (Max 10)                      │
│                                         │
│  ⚠ Invalid file type: document.pdf.    │
│     Please select JPEG, PNG, GIF, or   │
│     WebP images.                        │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Add Images                     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Upload 1-10 images. JPEG, PNG, GIF,   │
│  or WebP. Max 5MB each.                │
└─────────────────────────────────────────┘
```

**User Experience:**
- Error message at top of section
- Specific file name mentioned
- Clear guidance on valid types
- Helper text reminds of requirements

## 8. Character Count Feedback

Real-time character count for text fields:

```
┌─────────────────────────────────────────┐
│  Create Listing                         │
├─────────────────────────────────────────┤
│                                         │
│  Title *                                │
│  ┌───────────────────────────────────┐ │
│  │ Vintage Camera                    │ │
│  └───────────────────────────────────┘ │
│  14/100 characters. Be specific and     │
│  descriptive.                           │
│                                         │
│  Description *                          │
│  ┌───────────────────────────────────┐ │
│  │ Beautiful vintage camera in       │ │
│  │ excellent condition...            │ │
│  └───────────────────────────────────┘ │
│  87/2000 characters. Include important  │
│  details.                               │
└─────────────────────────────────────────┘
```

**User Experience:**
- Live character count updates as user types
- Shows current count and maximum
- Helper text provides guidance
- User knows how much space they have

## 9. Form Submission Loading State

When form is being submitted:

```
┌─────────────────────────────────────────┐
│  Sign In                                │
├─────────────────────────────────────────┤
│                                         │
│  Email Address *                        │
│  ┌───────────────────────────────────┐ │
│  │ user@example.com     [✓]          │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Password *                             │
│  ┌───────────────────────────────────┐ │
│  │ ••••••••             [✓]          │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  ⟳ Signing In... (DISABLED)    │   │ ← Loading spinner
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**User Experience:**
- Button shows loading spinner
- Button text changes to indicate action
- Button is disabled during submission
- User knows request is processing

## 10. API Error After Submission

When server returns an error:

```
┌─────────────────────────────────────────┐
│  Sign In                                │
├─────────────────────────────────────────┤
│                                         │
│  ⚠ Invalid email or password. Please   │
│     try again.                          │ ← Error alert at top
│                                         │
│  Email Address *                        │
│  ┌───────────────────────────────────┐ │
│  │ user@example.com                  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Password *                             │
│  ┌───────────────────────────────────┐ │
│  │ ••••••••                          │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Sign In                        │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**User Experience:**
- Error alert at top of form
- Specific error message from server
- Form remains filled (user doesn't lose data)
- User can fix and retry

## Validation Timing

### When Validation Occurs:

1. **On Blur** (when user leaves field)
   - Most common approach
   - Validates after user finishes typing
   - Less intrusive than real-time

2. **On Submit** (when user clicks submit)
   - Final validation before sending to server
   - Catches any missed errors
   - Shows all errors at once

3. **Real-Time** (as user types, with debouncing)
   - Used for character counts
   - Debounced to avoid excessive validation
   - Provides immediate feedback

4. **On Change** (for specific fields)
   - Used for password confirmation
   - Validates against another field
   - Updates when either field changes

## Color Coding

### Visual States:

- **Default:** Gray border (`--color-border`)
- **Focus:** Blue border (`--color-primary`)
- **Error:** Red border (`--color-error`)
- **Success:** Green border (`--color-success`)
- **Disabled:** Gray background, reduced opacity

### Icons:

- **Error:** Red X icon (⚠ or ✕)
- **Success:** Green checkmark (✓)
- **Loading:** Spinning circle (⟳)

## Accessibility Features

### Screen Reader Announcements:

```
User focuses on email field:
→ "Email Address, required, edit text"

User enters invalid email and leaves field:
→ "Email Address, invalid, Please enter a valid email address"

User enters valid email:
→ "Email Address, valid"

User tries to submit invalid form:
→ "Form has errors. Please fix the following: Email is required, Password is required"
```

### Keyboard Navigation:

- **Tab:** Move to next field
- **Shift+Tab:** Move to previous field
- **Enter:** Submit form (if valid)
- **Escape:** Close modal/cancel

## Summary

Form validation feedback provides:

✅ **Immediate feedback** - Users know what's wrong instantly
✅ **Clear guidance** - Specific error messages explain the problem
✅ **Visual indicators** - Colors and icons show field states
✅ **Disabled buttons** - Prevent invalid submissions
✅ **Accessibility** - Screen readers announce errors
✅ **Better UX** - Users complete forms faster with less frustration

The validation system guides users to successful form completion while maintaining security through server-side validation.
