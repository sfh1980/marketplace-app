# Email Verification Testing Guide

This guide explains how to test the email verification functionality manually.

## Prerequisites

1. PostgreSQL database running
2. Backend server running (`npm run dev` in backend directory)
3. API testing tool (Postman, curl, or similar)

## Email Configuration

### Development Mode (Default)

By default, the system runs in development mode where emails are **logged to the console** instead of being sent. This is perfect for testing without setting up an email server.

When you register a user, you'll see output like this in the console:

```
📧 ===== EMAIL (Development Mode) =====
To: user@example.com
Subject: Verify Your Email - Marketplace Platform
Verification URL: http://localhost:5173/verify-email?token=abc123...
=====================================
```

### Production Mode (Optional)

To actually send emails, configure these environment variables in `backend/.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@marketplace.com
```

**For Gmail:**
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password (not your regular password) in `EMAIL_PASSWORD`

## Testing Flow

### 1. Register a New User

**Endpoint:** `POST http://localhost:5000/api/auth/register`

**Request Body:**
```json
{
  "email": "test@example.com",
  "username": "testuser",
  "password": "TestPassword123!",
  "location": "New York, NY"
}
```

**Expected Response (201 Created):**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "username": "testuser",
    "emailVerified": false,
    "location": "New York, NY",
    "joinDate": "2024-01-01T00:00:00.000Z"
  }
}
```

**Check Console:** You should see the verification URL logged in the server console.

### 2. Verify Email

**Endpoint:** `GET http://localhost:5000/api/auth/verify-email/:token`

Replace `:token` with the token from the console output.

**Example:**
```
GET http://localhost:5000/api/auth/verify-email/abc123def456...
```

**Expected Response (200 OK):**
```json
{
  "message": "Email verified successfully. You can now log in."
}
```

### 3. Resend Verification Email

If the token expires or the email is lost, users can request a new verification email.

**Endpoint:** `POST http://localhost:5000/api/auth/resend-verification`

**Request Body:**
```json
{
  "email": "test@example.com"
}
```

**Expected Response (200 OK):**
```json
{
  "message": "If an unverified account exists with this email, a new verification email has been sent."
}
```

**Check Console:** You should see a new verification URL with a different token.

## Testing Error Cases

### 1. Invalid Token

**Request:**
```
GET http://localhost:5000/api/auth/verify-email/invalid-token-123
```

**Expected Response (400 Bad Request):**
```json
{
  "error": {
    "code": "VERIFICATION_FAILED",
    "message": "Invalid or expired verification token"
  }
}
```

### 2. Already Verified Email

Try to verify the same token twice.

**Expected Response (400 Bad Request):**
```json
{
  "error": {
    "code": "VERIFICATION_FAILED",
    "message": "Invalid or expired verification token"
  }
}
```

### 3. Expired Token

Tokens expire after 24 hours. To test this:

1. Register a user
2. Manually update the database to set `emailVerificationExpires` to a past date
3. Try to verify with the token

**Expected Response (400 Bad Request):**
```json
{
  "error": {
    "code": "VERIFICATION_FAILED",
    "message": "Verification token has expired"
  }
}
```

### 4. Resend for Already Verified Email

**Request:**
```json
POST http://localhost:5000/api/auth/resend-verification
{
  "email": "already-verified@example.com"
}
```

**Expected Response (400 Bad Request):**
```json
{
  "error": {
    "code": "ALREADY_VERIFIED",
    "message": "This email address is already verified"
  }
}
```

## Database Verification

You can check the database directly to verify the state:

```sql
-- Check user's verification status
SELECT 
  id, 
  email, 
  username, 
  "emailVerified", 
  "emailVerificationToken", 
  "emailVerificationExpires"
FROM "User"
WHERE email = 'test@example.com';
```

**Before Verification:**
- `emailVerified`: false
- `emailVerificationToken`: 64-character hex string
- `emailVerificationExpires`: timestamp 24 hours in the future

**After Verification:**
- `emailVerified`: true
- `emailVerificationToken`: null
- `emailVerificationExpires`: null

## Security Features Tested

✅ **Token Security:**
- Tokens are 64 characters (32 bytes) of cryptographically secure random data
- Tokens are unique for each user
- Tokens are stored hashed in the database

✅ **Token Expiration:**
- Tokens expire after 24 hours
- Expired tokens are rejected

✅ **Single-Use Tokens:**
- Tokens are cleared after successful verification
- Cannot be reused

✅ **Email Privacy:**
- Verification tokens are never returned in API responses
- Only sent via email (or logged in development)

✅ **Rate Limiting (Future):**
- Resend endpoint should be rate-limited in production
- Prevents spam and abuse

## Common Issues

### Email Not Sending (Production Mode)

**Problem:** Emails aren't being sent even with configuration.

**Solutions:**
1. Check that `EMAIL_USER` and `EMAIL_PASSWORD` are set correctly
2. For Gmail, ensure you're using an App Password, not your regular password
3. Check that 2FA is enabled on your Google account
4. Check server logs for error messages
5. Run `npm run dev` and look for email configuration errors

### Token Not Found

**Problem:** Verification fails with "Invalid or expired verification token"

**Solutions:**
1. Check that you're using the complete token (64 characters)
2. Verify the token hasn't expired (24 hours)
3. Check that the user hasn't already been verified
4. Ensure you're copying the token correctly (no extra spaces)

### Database Connection Issues

**Problem:** Registration fails with database errors

**Solutions:**
1. Ensure PostgreSQL is running
2. Check `DATABASE_URL` in `.env` is correct
3. Run `npx prisma migrate dev` to ensure schema is up to date
4. Check database logs for connection errors

## Next Steps

After email verification is working:
1. Implement login endpoint (Task 7)
2. Add authentication middleware
3. Protect routes that require verified emails
4. Add rate limiting to prevent abuse
5. Set up proper email service for production

## Testing Checklist

- [ ] User can register successfully
- [ ] Verification email is logged/sent
- [ ] User can verify email with valid token
- [ ] Email is marked as verified in database
- [ ] Token is cleared after verification
- [ ] Invalid tokens are rejected
- [ ] Expired tokens are rejected
- [ ] Already verified emails can't be re-verified
- [ ] User can resend verification email
- [ ] New token works after resend
- [ ] Old token doesn't work after resend
- [ ] Resend fails for already verified emails
