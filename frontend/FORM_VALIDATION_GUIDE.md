# Form Validation Feedback Guide

## Overview

This guide explains the form validation patterns used throughout the Marketplace Platform. We implement comprehensive client-side validation to provide immediate feedback and improve user experience.

## What is Form Validation Feedback?

Form validation feedback is the process of checking user input and providing clear, immediate feedback about:
- **What's wrong** - Specific error messages
- **What's right** - Visual confirmation of valid input
- **What's needed** - Guidance on requirements
- **When to submit** - Disabled buttons when form is invalid

## Why Client-Side Validation?

### Benefits
1. **Immediate Feedback** - No need to wait for server response
2. **Better UX** - Users know what's wrong instantly
3. **Reduced Server Load** - Invalid requests never reach the server
4. **Offline Capability** - Works without internet connection
5. **Saves Time** - Users fix errors before submission

### Important Note
**Client-side validation is for UX only!** Always validate on the server too because:
- Users can bypass client-side validation (disable JavaScript, modify code)
- Security requires server-side validation
- Data integrity must be enforced at the source

## Validation Patterns

### 1. Inline Error Messages

Show errors directly below the field that has the problem.

**Example:**
```tsx
<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}  // Shows error message below input
  required
/>
```

**Benefits:**
- Clear association between error and field
- User knows exactly what to fix
- Accessible (screen readers announce errors)

### 2. Disabled Submit Buttons

Disable the submit button when the form has validation errors.

**Example:**
```tsx
const isFormValid = () => {
  return email && password && !emailError && !passwordError;
};

<Button
  type="submit"
  disabled={!isFormValid() || isSubmitting}
>
  Submit
</Button>
```

**Benefits:**
- Prevents frustration (user can't submit invalid form)
- Clear feedback (disabled button = something needs fixing)
- Better UX (user knows form state at a glance)

### 3. Visual Feedback

Show visual indicators for field states:
- **Error state** - Red border, error icon, error message
- **Success state** - Green border, checkmark icon
- **Default state** - Gray border

**Example:**
```tsx
<Input
  label="Email"
  value={email}
  error={emailError}      // Red border + error icon
  success={emailValid}    // Green border + checkmark
/>
```

### 4. Real-Time Validation

Validate as the user types (with debouncing to avoid excessive validation).

**Example:**
```tsx
import { debounce } from '../utils/validation';

const debouncedValidate = debounce((value) => {
  setEmailError(validateEmail(value));
}, 300); // Wait 300ms after user stops typing

<Input
  onChange={(e) => {
    setEmail(e.target.value);
    debouncedValidate(e.target.value);
  }}
/>
```

**Benefits:**
- Immediate feedback as user types
- Debouncing prevents excessive validation
- User sees errors before moving to next field

### 5. Validation on Blur

Validate when the user leaves a field (onBlur event).

**Example:**
```tsx
<Input
  onBlur={() => {
    setEmailError(validateEmail(email));
  }}
/>
```

**Benefits:**
- Less intrusive than real-time validation
- Validates after user finishes typing
- Good balance between immediate and delayed feedback

## Validation Rules

### Email
- **Required:** Yes
- **Format:** Valid email address (user@domain.tld)
- **Regex:** `/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i`

### Username
- **Required:** Yes
- **Length:** 3-20 characters
- **Format:** Letters, numbers, underscores only
- **Regex:** `/^[a-zA-Z0-9_]{3,20}$/`

### Password
- **Required:** Yes
- **Length:** Minimum 8 characters
- **Strength:** Must include uppercase, lowercase, and number
- **Regex:** `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/`

### Password Confirmation
- **Required:** Yes
- **Match:** Must match password field exactly

### Listing Title
- **Required:** Yes
- **Length:** 5-100 characters

### Listing Description
- **Required:** Yes
- **Length:** 20-2000 characters

### Price
- **Required:** Yes
- **Format:** Positive number greater than 0

### Images
- **Required:** At least 1 image
- **Maximum:** 10 images
- **File Type:** JPEG, PNG, GIF, or WebP
- **File Size:** Maximum 5MB per image

## Implementation Examples

### Example 1: Login Form (React Hook Form)

```tsx
import { useForm } from 'react-hook-form';

const LoginPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onBlur', // Validate on blur
  });

  const onSubmit = async (data) => {
    // Submit form
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Email"
        type="email"
        error={errors.email?.message}
        {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Please enter a valid email address',
          },
        })}
      />
      
      <Button
        type="submit"
        disabled={isSubmitting}
      >
        Sign In
      </Button>
    </form>
  );
};
```

### Example 2: Create Listing Form (Manual Validation)

```tsx
const CreateListingPage = () => {
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);

  const validateTitle = (value: string) => {
    if (value.length === 0) {
      return 'Title is required';
    }
    if (value.length < 5) {
      return 'Title must be at least 5 characters';
    }
    if (value.length > 100) {
      return 'Title must be no more than 100 characters';
    }
    return null;
  };

  const isFormValid = () => {
    return title && !titleError && /* other validations */;
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Title"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setTitleError(validateTitle(e.target.value));
        }}
        error={titleError}
      />
      
      <Button
        type="submit"
        disabled={!isFormValid()}
      >
        Create Listing
      </Button>
      
      {!isFormValid() && (
        <p className={styles.validationHint}>
          Please fill in all required fields to create your listing
        </p>
      )}
    </form>
  );
};
```

### Example 3: Profile Edit Form (Change Detection)

```tsx
const ProfileEditPage = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  
  // Check if form has changes
  const hasChanges = username !== user?.username;
  
  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      
      <Button
        type="submit"
        disabled={!hasChanges || isSubmitting}
      >
        Save Changes
      </Button>
    </form>
  );
};
```

## Validation Utilities

We provide reusable validation functions in `src/utils/validation.ts`:

```tsx
import {
  validateEmail,
  validateUsername,
  validatePassword,
  validatePasswordMatch,
  validateRequired,
  validateLength,
  validatePrice,
  validateImageFile,
  isFormValid,
  debounce,
} from '../utils/validation';

// Example usage
const emailError = validateEmail(email);
const usernameError = validateUsername(username);
const passwordError = validatePassword(password);
const confirmError = validatePasswordMatch(password, confirmPassword);
```

## Accessibility Considerations

### ARIA Attributes

Our Input component automatically adds proper ARIA attributes:

```tsx
<input
  aria-invalid={hasError}
  aria-describedby={error ? `${inputId}-error` : undefined}
/>

{error && (
  <p id={`${inputId}-error`} role="alert">
    {error}
  </p>
)}
```

### Screen Reader Support

- **Error messages** are announced with `role="alert"`
- **Required fields** are marked with `required` attribute
- **Labels** are properly associated with inputs using `htmlFor`
- **Helper text** is linked with `aria-describedby`

### Keyboard Navigation

- All form fields are keyboard accessible
- Tab order follows visual order
- Enter key submits forms
- Escape key closes modals

## Best Practices

### DO ✅

1. **Validate on blur** - Less intrusive than real-time
2. **Show specific errors** - "Email is required" not "Invalid input"
3. **Disable submit on invalid** - Prevents frustration
4. **Use consistent messages** - Same error for same problem
5. **Validate on server too** - Client-side is for UX only
6. **Provide helper text** - Guide users before they make mistakes
7. **Use visual indicators** - Colors, icons, borders
8. **Make errors accessible** - ARIA attributes, role="alert"

### DON'T ❌

1. **Don't validate on every keystroke** - Too intrusive (use debouncing)
2. **Don't use generic errors** - "Invalid" doesn't help
3. **Don't hide submit button** - Disable it instead
4. **Don't rely only on color** - Use icons and text too
5. **Don't skip server validation** - Security risk
6. **Don't validate before user interacts** - Wait for blur or submit
7. **Don't use jargon** - "Regex failed" → "Invalid email format"
8. **Don't block submission forever** - Show what needs fixing

## Testing Validation

### Manual Testing Checklist

- [ ] Submit empty form - all required fields show errors
- [ ] Enter invalid email - shows format error
- [ ] Enter weak password - shows strength error
- [ ] Passwords don't match - shows match error
- [ ] Submit button disabled when invalid
- [ ] Submit button enabled when valid
- [ ] Errors clear when fixed
- [ ] Success indicators show for valid fields
- [ ] Tab through form - proper focus order
- [ ] Screen reader announces errors

### Automated Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';

test('shows error for invalid email', () => {
  render(<LoginPage />);
  
  const emailInput = screen.getByLabelText('Email');
  fireEvent.change(emailInput, { target: { value: 'invalid' } });
  fireEvent.blur(emailInput);
  
  expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
});

test('disables submit button when form is invalid', () => {
  render(<LoginPage />);
  
  const submitButton = screen.getByRole('button', { name: 'Sign In' });
  expect(submitButton).toBeDisabled();
});
```

## Common Patterns by Form

### Authentication Forms
- **Login:** Email + Password validation
- **Register:** Email + Username + Password + Confirm Password
- **Forgot Password:** Email validation
- **Reset Password:** Password + Confirm Password

### Listing Forms
- **Create Listing:** Title + Description + Price + Category + Location + Images
- **Edit Listing:** Same as create, but some fields may be read-only

### Profile Forms
- **Edit Profile:** Username + Location + Profile Picture
- **Change detection:** Only enable save if something changed

### Message Forms
- **Send Message:** Message content (required, non-empty)
- **Real-time:** Disable send button if message is empty

## Troubleshooting

### Submit button stays disabled
- Check all validation functions return null for valid input
- Verify isFormValid() logic is correct
- Console.log validation errors to debug

### Errors don't show
- Verify error prop is passed to Input component
- Check error state is being set correctly
- Ensure validation functions are being called

### Validation too aggressive
- Use onBlur instead of onChange
- Add debouncing for real-time validation
- Don't validate before user interacts

### Validation too lenient
- Check regex patterns are correct
- Verify all required fields are checked
- Ensure server-side validation matches

## Resources

- [React Hook Form Documentation](https://react-hook-form.com/)
- [WCAG Form Validation Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html)
- [MDN: Client-side form validation](https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation)
- [Validation Utilities](../src/utils/validation.ts)

## Summary

Good form validation feedback is essential for UX. It should be:
- **Immediate** - Show errors as soon as possible
- **Clear** - Specific messages about what's wrong
- **Helpful** - Guide users to fix problems
- **Accessible** - Work with screen readers and keyboards
- **Consistent** - Same patterns across all forms

Remember: Client-side validation is for UX, server-side validation is for security!
