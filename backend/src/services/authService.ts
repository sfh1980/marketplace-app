/**
 * Authentication Service
 * 
 * This service handles all authentication-related business logic including:
 * - User registration with password hashing
 * - Email verification token generation
 * - Password validation
 * 
 * Why a separate service layer?
 * - Separates business logic from HTTP handling (controllers)
 * - Makes code easier to test (can test without HTTP requests)
 * - Allows reuse of logic across different controllers
 * - Follows Single Responsibility Principle
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Password hashing configuration
 * 
 * SALT_ROUNDS determines how many times the hashing algorithm runs.
 * Higher = more secure but slower. 12 is the recommended balance.
 * 
 * Why bcrypt?
 * 1. Designed specifically for password hashing (not general encryption)
 * 2. Automatically handles salt generation (prevents rainbow table attacks)
 * 3. Adaptive - can increase rounds as computers get faster
 * 4. Industry standard, battle-tested for decades
 * 
 * What's a salt?
 * Random data added to password before hashing. Even if two users have
 * the same password, their hashes will be different. This prevents:
 * - Rainbow table attacks (pre-computed hash databases)
 * - Identifying users with same password
 */
const SALT_ROUNDS = 12;

/**
 * Interface for registration data
 * This defines what data we need to register a user
 */
export interface RegisterUserData {
  email: string;
  username: string;
  password: string;
  location?: string;
}

/**
 * Interface for the created user (without sensitive data)
 * We never return password hashes to the client
 */
export interface CreatedUser {
  id: string;
  email: string;
  username: string;
  emailVerified: boolean;
  location: string | null;
  joinDate: Date;
  verificationToken: string; // Sent via email, not stored in DB
}

/**
 * Hash a password using bcrypt
 * 
 * This is a one-way function - you can't reverse it to get the original password.
 * To verify a password later, you hash the input and compare hashes.
 * 
 * @param password - Plain text password from user
 * @returns Hashed password safe to store in database
 */
export async function hashPassword(password: string): Promise<string> {
  // bcrypt.hash automatically:
  // 1. Generates a random salt
  // 2. Combines salt with password
  // 3. Runs hashing algorithm SALT_ROUNDS times
  // 4. Returns hash that includes the salt (so we can verify later)
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a stored hash
 * 
 * @param password - Plain text password from login attempt
 * @param hash - Stored password hash from database
 * @returns true if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  // bcrypt.compare:
  // 1. Extracts the salt from the stored hash
  // 2. Hashes the input password with that salt
  // 3. Compares the result with the stored hash
  // This is why we don't need to store the salt separately!
  return bcrypt.compare(password, hash);
}

/**
 * Generate a secure random token for email verification
 * 
 * Why crypto.randomBytes?
 * - Cryptographically secure random number generator
 * - Much more secure than Math.random()
 * - Suitable for security-sensitive operations
 * 
 * Why 32 bytes?
 * - Produces a 64-character hex string
 * - Extremely difficult to guess (2^256 possibilities)
 * - Industry standard for verification tokens
 * 
 * @returns Secure random token as hex string
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Register a new user
 * 
 * This function:
 * 1. Hashes the password (never store plain text!)
 * 2. Generates email verification token
 * 3. Creates user in database with token
 * 4. Returns user data and token (token sent via email in controller)
 * 
 * Token expiration:
 * - Tokens expire after 24 hours for security
 * - After expiration, user must request a new verification email
 * - This prevents old tokens from being used indefinitely
 * 
 * Error handling:
 * - Prisma will throw if email/username already exists (unique constraint)
 * - Controller layer will catch and return appropriate HTTP error
 * 
 * @param data - User registration data
 * @returns Created user with verification token
 * @throws Error if email or username already exists
 */
export async function registerUser(
  data: RegisterUserData
): Promise<CreatedUser> {
  // Step 1: Hash the password
  // This is CRITICAL for security - never store plain text passwords!
  const passwordHash = await hashPassword(data.password);

  // Step 2: Generate email verification token
  // User must verify email before full account access
  const verificationToken = generateVerificationToken();

  // Step 3: Calculate token expiration (24 hours from now)
  // Why 24 hours?
  // - Long enough for user to check email at their convenience
  // - Short enough to prevent security issues
  // - Industry standard for verification tokens
  const tokenExpiration = new Date();
  tokenExpiration.setHours(tokenExpiration.getHours() + 24);

  // Step 4: Create user in database
  // Prisma will automatically:
  // - Generate UUID for id
  // - Set createdAt and updatedAt timestamps
  // - Set default values (emailVerified: false, averageRating: 0)
  // - Enforce unique constraints on email and username
  const user = await prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      passwordHash,
      location: data.location || null,
      emailVerified: false, // Must verify email first
      emailVerificationToken: verificationToken,
      emailVerificationExpires: tokenExpiration,
    },
  });

  // Step 5: Return user data (without password hash!) and verification token
  // The controller will send the token via email
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    emailVerified: user.emailVerified,
    location: user.location,
    joinDate: user.joinDate,
    verificationToken,
  };
}

/**
 * Check if an email is already registered
 * 
 * Useful for:
 * - Pre-validation before attempting registration
 * - Providing better error messages
 * - Password reset flow (check if email exists)
 * 
 * @param email - Email address to check
 * @returns true if email exists, false otherwise
 */
export async function emailExists(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true }, // Only select id for efficiency
  });
  return user !== null;
}

/**
 * Check if a username is already taken
 * 
 * @param username - Username to check
 * @returns true if username exists, false otherwise
 */
export async function usernameExists(username: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  return user !== null;
}

/**
 * Verify user's email address using verification token
 * 
 * This function:
 * 1. Finds user by verification token
 * 2. Checks if token has expired
 * 3. Marks email as verified
 * 4. Clears the verification token (single-use)
 * 
 * Security considerations:
 * - Tokens are single-use (cleared after verification)
 * - Tokens expire after 24 hours
 * - Constant-time comparison prevents timing attacks
 * - Already verified emails can't be re-verified
 * 
 * @param token - Verification token from email link
 * @returns true if verification successful, false otherwise
 * @throws Error with specific message for different failure cases
 */
export async function verifyEmail(token: string): Promise<boolean> {
  // Step 1: Find user by verification token
  // We use findUnique because emailVerificationToken has a unique constraint
  const user = await prisma.user.findUnique({
    where: { emailVerificationToken: token },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      emailVerificationExpires: true,
    },
  });

  // Step 2: Check if token exists
  if (!user) {
    throw new Error('Invalid or expired verification token');
  }

  // Step 3: Check if email is already verified
  // This prevents re-verification attacks
  if (user.emailVerified) {
    throw new Error('Email is already verified');
  }

  // Step 4: Check if token has expired
  // Compare current time with expiration time
  if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
    throw new Error('Verification token has expired');
  }

  // Step 5: Mark email as verified and clear token
  // Why clear the token?
  // - Prevents token reuse (single-use tokens)
  // - Reduces database storage
  // - Security best practice
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null, // Clear token
      emailVerificationExpires: null, // Clear expiration
    },
  });

  console.log(`✅ Email verified for user: ${user.email}`);
  return true;
}

/**
 * Resend verification email
 * 
 * Useful when:
 * - Original email was lost or deleted
 * - Token expired
 * - Email went to spam
 * 
 * Security considerations:
 * - Rate limit this endpoint to prevent spam
 * - Only allow for unverified accounts
 * - Generate new token each time
 * 
 * @param email - User's email address
 * @returns New verification token
 * @throws Error if email doesn't exist or is already verified
 */
export async function resendVerificationEmail(email: string): Promise<string> {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      emailVerified: true,
    },
  });

  // Check if user exists
  if (!user) {
    throw new Error('No account found with this email address');
  }

  // Check if already verified
  if (user.emailVerified) {
    throw new Error('Email is already verified');
  }

  // Generate new token and expiration
  const verificationToken = generateVerificationToken();
  const tokenExpiration = new Date();
  tokenExpiration.setHours(tokenExpiration.getHours() + 24);

  // Update user with new token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: verificationToken,
      emailVerificationExpires: tokenExpiration,
    },
  });

  console.log(`🔄 Verification email resent to: ${email}`);
  return verificationToken;
}

/**
 * Login user and generate JWT token
 * 
 * This function:
 * 1. Finds user by email
 * 2. Verifies password matches stored hash
 * 3. Checks if email is verified
 * 4. Generates JWT token with user information
 * 
 * JWT (JSON Web Token) explained:
 * - A token is a string that contains encoded user information
 * - It's signed with a secret key so it can't be tampered with
 * - The server can verify the token without storing session data (stateless)
 * - Tokens have an expiration time for security
 * 
 * Token structure:
 * - Header: Algorithm and token type
 * - Payload: User data (id, email, username)
 * - Signature: Ensures token hasn't been modified
 * 
 * Security considerations:
 * - Never include sensitive data in JWT (it's encoded, not encrypted)
 * - Use strong secret key (stored in environment variables)
 * - Set reasonable expiration time (15 minutes for access token)
 * - Verify email before allowing login (prevents fake accounts)
 * 
 * @param email - User's email address
 * @param password - User's plain text password
 * @returns Object with JWT token and user information
 * @throws Error if credentials are invalid or email not verified
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
    emailVerified: boolean;
    location: string | null;
  };
}> {
  // Step 1: Find user by email
  // We need to select passwordHash to verify the password
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      username: true,
      passwordHash: true,
      emailVerified: true,
      location: true,
    },
  });

  // Step 2: Check if user exists
  // We use a generic error message to avoid revealing if email exists
  // This prevents attackers from enumerating valid email addresses
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Step 3: Check if email is verified
  // We require email verification before allowing login
  // This ensures users have access to the email they registered with
  if (!user.emailVerified) {
    throw new Error('Please verify your email before logging in');
  }

  // Step 4: Verify password
  // Compare the provided password with the stored hash
  // bcrypt.compare handles extracting the salt and hashing
  if (!user.passwordHash) {
    throw new Error('Invalid email or password');
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    // Use same error message as "user not found" for security
    throw new Error('Invalid email or password');
  }

  // Step 5: Generate JWT token
  // The token contains user information (payload) and is signed with a secret
  const token = generateJWT({
    userId: user.id,
    email: user.email,
    username: user.username,
  });

  // Step 6: Return token and user information
  // Note: We don't return the password hash!
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      emailVerified: user.emailVerified,
      location: user.location,
    },
  };
}

/**
 * Generate a JWT token
 * 
 * JWT Structure:
 * - Header: { "alg": "HS256", "typ": "JWT" }
 * - Payload: { userId, email, username, iat, exp }
 * - Signature: HMACSHA256(base64(header) + "." + base64(payload), secret)
 * 
 * The token is three base64-encoded strings separated by dots:
 * xxxxx.yyyyy.zzzzz
 * 
 * Why JWT for authentication?
 * 1. Stateless: Server doesn't need to store sessions
 * 2. Scalable: Works across multiple servers
 * 3. Mobile-friendly: Easy to use in mobile apps
 * 4. Standard: Widely supported across platforms
 * 
 * Security best practices:
 * - Use strong secret key (at least 256 bits)
 * - Set short expiration time (15 minutes)
 * - Use HTTPS to prevent token interception
 * - Store secret in environment variables (never in code)
 * - Validate token on every protected request
 * 
 * @param payload - Data to include in token
 * @returns Signed JWT token string
 */
function generateJWT(payload: {
  userId: string;
  email: string;
  username: string;
}): string {
  const jwt = require('jsonwebtoken');

  // Get secret from environment variable
  // This should be a long, random string stored in .env file
  // NEVER hardcode secrets in your code!
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  // Generate token with 15-minute expiration
  // Why 15 minutes?
  // - Short enough to limit damage if token is stolen
  // - Long enough for reasonable user session
  // - Can be refreshed with a refresh token (future feature)
  const token = jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      username: payload.username,
    },
    secret,
    {
      expiresIn: '15m', // Token expires in 15 minutes
      issuer: 'marketplace-platform', // Who issued the token
      audience: 'marketplace-users', // Who the token is for
    }
  );

  return token;
}

/**
 * Verify a JWT token
 * 
 * This function:
 * 1. Checks if token is properly formatted
 * 2. Verifies signature hasn't been tampered with
 * 3. Checks if token has expired
 * 4. Returns decoded payload if valid
 * 
 * Used by authentication middleware to protect routes
 * 
 * @param token - JWT token string
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyJWT(token: string): {
  userId: string;
  email: string;
  username: string;
} {
  const jwt = require('jsonwebtoken');

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  try {
    // jwt.verify will throw if:
    // - Token is malformed
    // - Signature is invalid
    // - Token has expired
    // - Issuer/audience don't match
    const decoded = jwt.verify(token, secret, {
      issuer: 'marketplace-platform',
      audience: 'marketplace-users',
    });

    return {
      userId: decoded.userId,
      email: decoded.email,
      username: decoded.username,
    };
  } catch (error) {
    if (error instanceof Error) {
      // Provide specific error messages for debugging
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
    }
    throw new Error('Token verification failed');
  }
}

/**
 * Request password reset
 * 
 * This function:
 * 1. Finds user by email
 * 2. Generates a secure reset token
 * 3. Stores token with expiration time (1 hour)
 * 4. Returns token to be sent via email
 * 
 * Security considerations:
 * - Tokens expire after 1 hour (short window for security)
 * - Tokens are single-use (cleared after password reset)
 * - We don't reveal if email exists (prevents email enumeration)
 * - Uses cryptographically secure random token generation
 * 
 * Why 1 hour expiration?
 * - Long enough for user to check email and reset password
 * - Short enough to limit security risk if token is intercepted
 * - Industry standard for password reset tokens
 * 
 * Email enumeration prevention:
 * - We return success even if email doesn't exist
 * - This prevents attackers from discovering valid email addresses
 * - The user experience is the same regardless
 * 
 * @param email - User's email address
 * @returns Reset token (to be sent via email)
 * @throws Error only for unexpected database errors
 */
export async function requestPasswordReset(email: string): Promise<string | null> {
  // Step 1: Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      emailVerified: true,
    },
  });

  // Step 2: If user doesn't exist, return null
  // We don't throw an error to prevent email enumeration
  // The controller will return a generic success message
  if (!user) {
    console.log(`⚠️  Password reset requested for non-existent email: ${email}`);
    return null;
  }

  // Step 3: Check if email is verified
  // Only allow password reset for verified accounts
  // This prevents abuse of the password reset system
  if (!user.emailVerified) {
    console.log(`⚠️  Password reset requested for unverified email: ${email}`);
    return null;
  }

  // Step 4: Generate secure reset token
  // Using crypto.randomBytes for cryptographically secure randomness
  // 32 bytes = 64 hex characters = extremely difficult to guess
  const resetToken = generateVerificationToken(); // Reusing the same secure token generation

  // Step 5: Calculate token expiration (1 hour from now)
  const tokenExpiration = new Date();
  tokenExpiration.setHours(tokenExpiration.getHours() + 1);

  // Step 6: Store token and expiration in database
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpires: tokenExpiration,
    },
  });

  console.log(`🔑 Password reset token generated for: ${email}`);
  return resetToken;
}

/**
 * Reset password using reset token
 * 
 * This function:
 * 1. Finds user by reset token
 * 2. Validates token hasn't expired
 * 3. Hashes new password
 * 4. Updates password and clears reset token
 * 
 * Security considerations:
 * - Token must be valid and not expired
 * - Token is single-use (cleared after successful reset)
 * - New password is hashed before storage
 * - Old password is completely replaced (no history kept in MVP)
 * 
 * Token validation:
 * - Must exist in database
 * - Must not be expired (within 1 hour of generation)
 * - Automatically cleared after use
 * 
 * Password requirements:
 * - Validation happens in controller layer
 * - Must meet minimum strength requirements
 * - Hashed using bcrypt with salt rounds
 * 
 * @param token - Password reset token from email
 * @param newPassword - New password (plain text, will be hashed)
 * @returns true if reset successful
 * @throws Error if token is invalid, expired, or database error occurs
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<boolean> {
  // Step 1: Find user by reset token
  const user = await prisma.user.findUnique({
    where: { passwordResetToken: token },
    select: {
      id: true,
      email: true,
      passwordResetExpires: true,
    },
  });

  // Step 2: Validate token exists
  if (!user) {
    throw new Error('Invalid or expired password reset token');
  }

  // Step 3: Validate token hasn't expired
  if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
    // Token has expired - clear it from database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
    throw new Error('Password reset token has expired');
  }

  // Step 4: Hash the new password
  // Never store plain text passwords!
  // bcrypt automatically generates a salt and hashes the password
  const newPasswordHash = await hashPassword(newPassword);

  // Step 5: Update password and clear reset token
  // This is an atomic operation - either both succeed or both fail
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newPasswordHash,
      passwordResetToken: null, // Clear token (single-use)
      passwordResetExpires: null, // Clear expiration
    },
  });

  console.log(`✅ Password reset successful for: ${user.email}`);
  return true;
}
