# Password Reset Guide

## Overview

The password reset feature allows users to securely reset their password if they forget it. This guide explains how the system works and how to use it.

## How It Works

### Two-Step Process

**Step 1: Request Password Reset**
1. User enters their email address
2. System generates a secure random token
3. Token is stored in database with 1-hour expiration
4. Email sent with reset link containing the token
5. Generic success message returned (security)

**Step 2: Complete Password Reset**
1. User clicks link in email
2. Frontend extracts token from URL
3. User enters new password
4. System validates token and password
5. Password updated and token cleared
6. User can login with new password

## API Endpoints

### Request Password Reset

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200 OK):**
```json
{
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": {
    "code": "MISSING_EMAIL",
    "message": "Email address is required"
  }
}
```

**Notes:**
- Always returns same success message (prevents email enumeration)
- Only sends email to verified accounts
- Token expires after 1 hour
- Rate limit this endpoint to prevent abuse

### Complete Password Reset

**Endpoint:** `POST /api/auth/reset-password/:token`

**URL Parameter:**
- `token` - Password reset token from email (64-character hex string)

**Request Body:**
```json
{
  "password": "NewPass123!@#"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Password reset successful. You can now log in with your new password."
}
```

**Error Responses:**

Invalid or expired token (400 Bad Request):
```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid or expired password reset token"
  }
}
```

Missing password (400 Bad Request):
```json
{
  "error": {
    "code": "MISSING_PASSWORD",
    "message": "New password is required"
  }
}
```

Weak password (400 Bad Request):
```json
{
  "error": {
    "code": "WEAK_PASSWORD",
    "message": "Password does not meet requirements",
    "details": "Password must contain at least one uppercase letter"
  }
}
```

## Password Requirements

New passwords must meet these requirements:
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*()_+-=[]{}|;:'",.<>/?)
- Maximum 72 characters (bcrypt limit)

## Security Features

### 1. Secure Token Generation
- Uses `crypto.randomBytes(32)` for cryptographically secure randomness
- Produces 64-character hex string
- 2^256 possible combinations (extremely difficult to guess)

### 2. Time-Limited Tokens
- Tokens expire after 1 hour
- Short window limits security risk
- Industry standard for password reset

### 3. Single-Use Tokens
- Token cleared after successful password reset
- Prevents token reuse attacks
- Expired tokens also cleared from database

### 4. Email Enumeration Prevention
- Always returns same success message
- Doesn't reveal if email exists in system
- Prevents attackers from discovering valid accounts

### 5. Verified Accounts Only
- Only sends reset email to verified accounts
- Prevents abuse of password reset system
- Ensures user has access to email

### 6. Password Hashing
- New password hashed with bcrypt (12 rounds)
- Never stores plain text passwords
- Old password completely replaced

## Frontend Integration

### Request Password Reset Page

```typescript
async function requestPasswordReset(email: string) {
  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    
    if (response.ok) {
      // Show success message
      alert(data.message);
    } else {
      // Show error message
      alert(data.error.message);
    }
  } catch (error) {
    alert('An error occurred. Please try again.');
  }
}
```

### Complete Password Reset Page

```typescript
async function completePasswordReset(token: string, password: string) {
  try {
    const response = await fetch(`/api/auth/reset-password/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();
    
    if (response.ok) {
      // Show success message and redirect to login
      alert(data.message);
      window.location.href = '/login';
    } else {
      // Show error message
      alert(data.error.message);
      if (data.error.details) {
        alert(data.error.details);
      }
    }
  } catch (error) {
    alert('An error occurred. Please try again.');
  }
}

// Extract token from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
```

## Email Configuration

### Development Mode

In development, emails are logged to console instead of being sent:

```
📧 ===== PASSWORD RESET EMAIL (Development Mode) =====
To: user@example.com
Subject: Reset Your Password - Marketplace Platform
Reset URL: http://localhost:5173/reset-password?token=abc123...
====================================================
```

### Production Mode

Set these environment variables in `.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@marketplace.com
FRONTEND_URL=https://your-domain.com
```

**Gmail Setup:**
1. Enable 2-factor authentication on your Google account
2. Generate an app-specific password
3. Use the app password in EMAIL_PASSWORD (not your regular password)

## Testing

### Manual Testing

**Test Request Password Reset:**
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

**Test Complete Password Reset:**
```bash
curl -X POST http://localhost:5000/api/auth/reset-password/TOKEN_HERE \
  -H "Content-Type: application/json" \
  -d '{"password":"NewPass123!@#"}'
```

### Automated Tests

Run the password reset test suite:
```bash
cd backend
npm test -- password-reset.test.ts
```

Tests cover:
- ✅ Request reset for non-existent email (security)
- ✅ Request reset with missing email
- ✅ Generate token for verified user
- ✅ Reject token for unverified user
- ✅ Reset password with valid token
- ✅ Reject invalid token
- ✅ Reject missing password
- ✅ Reject weak password
- ✅ Reject expired token
- ✅ Prevent token reuse

## Common Issues

### Email Not Sending

**Problem:** Email not being sent in development
**Solution:** This is expected. Check console for logged email content.

**Problem:** Email not sending in production
**Solution:** 
1. Verify EMAIL_USER and EMAIL_PASSWORD are set correctly
2. Check if using Gmail, ensure app-specific password is used
3. Check email service logs for errors
4. Verify SMTP settings are correct for your provider

### Token Expired

**Problem:** User gets "expired token" error
**Solution:** 
1. Request a new password reset
2. Tokens expire after 1 hour for security
3. User must complete reset within 1 hour

### Token Already Used

**Problem:** User gets "invalid token" error after already resetting
**Solution:**
1. Tokens are single-use for security
2. Request a new password reset if needed again
3. User can login with their new password

### Weak Password Error

**Problem:** User gets "weak password" error
**Solution:**
1. Ensure password meets all requirements
2. Show password requirements on frontend
3. Provide real-time validation feedback

## Database Schema

### User Model Fields

```prisma
model User {
  // ... other fields ...
  
  passwordResetToken        String?  @unique
  passwordResetExpires      DateTime?
  
  // ... other fields ...
}
```

**passwordResetToken:**
- Nullable (null when no reset in progress)
- Unique (each token is unique across all users)
- 64-character hex string
- Cleared after successful reset

**passwordResetExpires:**
- Nullable (null when no reset in progress)
- Timestamp of when token expires
- Set to 1 hour after token generation
- Cleared after successful reset

## Best Practices

### For Developers

1. **Always validate tokens server-side** - Never trust client input
2. **Use HTTPS in production** - Protect tokens in transit
3. **Rate limit the request endpoint** - Prevent abuse
4. **Log security events** - Track password reset attempts
5. **Monitor for suspicious activity** - Multiple resets from same IP
6. **Clear expired tokens** - Run periodic cleanup job

### For Users

1. **Check email immediately** - Tokens expire after 1 hour
2. **Don't share reset links** - Tokens are single-use
3. **Use strong passwords** - Follow password requirements
4. **Contact support if issues** - Don't repeatedly request resets

## Troubleshooting

### User Can't Receive Email

1. Check spam/junk folder
2. Verify email address is correct
3. Ensure account is verified (only verified accounts get reset emails)
4. Check if email service is working (admin)

### Token Validation Fails

1. Verify token hasn't expired (1 hour limit)
2. Check if token was already used (single-use)
3. Ensure token is complete (64 characters)
4. Verify database connection is working

### Password Update Fails

1. Check password meets requirements
2. Verify token is valid and not expired
3. Check database connection
4. Review server logs for errors

## Security Considerations

### What We Protect Against

✅ **Email Enumeration** - Generic responses prevent account discovery
✅ **Token Reuse** - Tokens cleared after use prevent replay attacks
✅ **Brute Force** - Rate limiting prevents token guessing
✅ **Token Interception** - Short expiration limits damage window
✅ **Weak Passwords** - Strength requirements enforce security
✅ **Unverified Accounts** - Only verified users can reset

### What to Monitor

⚠️ **Multiple Reset Requests** - Could indicate attack or user confusion
⚠️ **Failed Token Validations** - Could indicate brute force attempt
⚠️ **Expired Token Usage** - Normal, but track frequency
⚠️ **Email Delivery Failures** - Could indicate service issues

## Future Enhancements

Potential improvements for post-MVP:

1. **Account Lockout** - Lock account after multiple failed attempts
2. **Password History** - Prevent reusing recent passwords
3. **Email Notification** - Notify user when password is changed
4. **Security Questions** - Additional verification before reset
5. **SMS Verification** - Alternative to email for reset
6. **Admin Override** - Allow admins to reset user passwords
7. **Password Strength Meter** - Visual feedback on password strength
8. **Breach Detection** - Check if password appears in known breaches

## Support

For issues or questions:
1. Check this guide first
2. Review server logs for errors
3. Run automated tests to verify functionality
4. Contact development team if issue persists

## References

- [OWASP Password Reset Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
- [Nodemailer Documentation](https://nodemailer.com/)
