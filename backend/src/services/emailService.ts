/**
 * Email Service
 * 
 * Handles all email-related functionality including:
 * - Sending verification emails
 * - Sending password reset emails
 * - Email template formatting
 * 
 * Why a separate email service?
 * - Centralized email configuration
 * - Reusable email sending logic
 * - Easy to swap email providers (just change transporter)
 * - Testable (can mock in tests)
 * 
 * Email Security Best Practices:
 * 1. Never expose email credentials in code (use environment variables)
 * 2. Use app-specific passwords (not your main email password)
 * 3. Enable 2FA on email account
 * 4. Use TLS/SSL for secure transmission
 * 5. Rate limit email sending to prevent abuse
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Email configuration from environment variables
 * 
 * Why environment variables?
 * - Different settings for dev/staging/production
 * - Keeps secrets out of code repository
 * - Easy to change without code changes
 * - Standard practice for 12-factor apps
 */
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports (587 uses STARTTLS)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
};

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@marketplace.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Create email transporter
 * 
 * What is a transporter?
 * - The connection to the email server
 * - Handles authentication and sending
 * - Can be reused for multiple emails
 * 
 * SMTP (Simple Mail Transfer Protocol):
 * - Standard protocol for sending email
 * - Port 587: STARTTLS (starts unencrypted, upgrades to TLS)
 * - Port 465: SSL/TLS from the start
 * - Port 25: Unencrypted (not recommended)
 */
let transporter: Transporter | null = null;

/**
 * Initialize the email transporter
 * 
 * Why lazy initialization?
 * - Only create connection when needed
 * - Allows for testing without email server
 * - Can check configuration before creating
 */
function getTransporter(): Transporter {
  if (!transporter) {
    // Check if email is configured
    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
      console.warn('⚠️  Email not configured. Emails will be logged to console instead.');
      console.warn('   Set EMAIL_USER and EMAIL_PASSWORD in .env to enable email sending.');
    }

    transporter = nodemailer.createTransport(EMAIL_CONFIG);
  }
  return transporter;
}

/**
 * Send email verification email
 * 
 * This email contains a link with the verification token.
 * When user clicks the link, they'll be directed to:
 * /verify-email?token=abc123...
 * 
 * The frontend will extract the token and send it to our API.
 * 
 * @param email - Recipient email address
 * @param username - User's username (for personalization)
 * @param token - Verification token
 */
export async function sendVerificationEmail(
  email: string,
  username: string,
  token: string
): Promise<void> {
  // Build verification URL
  // In production, FRONTEND_URL would be your actual domain
  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

  // Email content
  // We provide both HTML and plain text versions
  // - HTML: Rich formatting for modern email clients
  // - Plain text: Fallback for older clients or user preference
  const mailOptions = {
    from: FROM_EMAIL,
    to: email,
    subject: 'Verify Your Email - Marketplace Platform',
    
    // Plain text version
    text: `
Hello ${username},

Thank you for registering with Marketplace Platform!

Please verify your email address by clicking the link below:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

Best regards,
The Marketplace Team
    `.trim(),
    
    // HTML version (better formatting)
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #3b82f6;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Welcome to Marketplace Platform!</h2>
    <p>Hello ${username},</p>
    <p>Thank you for registering with Marketplace Platform. Please verify your email address to complete your registration.</p>
    <a href="${verificationUrl}" class="button">Verify Email Address</a>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
    <p><strong>This link will expire in 24 hours.</strong></p>
    <div class="footer">
      <p>If you didn't create an account, you can safely ignore this email.</p>
      <p>© ${new Date().getFullYear()} Marketplace Platform. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };

  try {
    // Check if email is configured
    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
      // Development mode: Log email instead of sending
      console.log('\n📧 ===== EMAIL (Development Mode) =====');
      console.log(`To: ${email}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Verification URL: ${verificationUrl}`);
      console.log('=====================================\n');
      return;
    }

    // Send email
    const info = await getTransporter().sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
    console.log(`   Message ID: ${info.messageId}`);
  } catch (error) {
    // Log error but don't throw - we don't want registration to fail if email fails
    console.error('❌ Failed to send verification email:', error);
    console.error(`   Recipient: ${email}`);
    
    // In production, you might want to:
    // - Queue the email for retry
    // - Alert administrators
    // - Log to error tracking service (Sentry, etc.)
    throw new Error('Failed to send verification email');
  }
}

/**
 * Verify email transporter configuration
 * 
 * Useful for:
 * - Testing email setup during deployment
 * - Health checks
 * - Debugging email issues
 * 
 * @returns true if email is configured and working
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
      return false;
    }
    await getTransporter().verify();
    console.log('✅ Email configuration verified');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return false;
  }
}

/**
 * Send password reset email
 * 
 * This email contains a link with the password reset token.
 * When user clicks the link, they'll be directed to:
 * /reset-password?token=abc123...
 * 
 * The frontend will extract the token and allow the user to enter a new password.
 * 
 * Security considerations:
 * - Token expires after 1 hour
 * - Token is single-use (cleared after password reset)
 * - Link should only be sent to verified email addresses
 * - Email should clearly state if user didn't request this
 * 
 * @param email - Recipient email address
 * @param token - Password reset token
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  // Build password reset URL
  // In production, FRONTEND_URL would be your actual domain
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

  // Email content
  // We provide both HTML and plain text versions
  const mailOptions = {
    from: FROM_EMAIL,
    to: email,
    subject: 'Reset Your Password - Marketplace Platform',
    
    // Plain text version
    text: `
Hello,

We received a request to reset your password for your Marketplace Platform account.

Please reset your password by clicking the link below:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.

Best regards,
The Marketplace Team
    `.trim(),
    
    // HTML version (better formatting)
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #3b82f6;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Reset Your Password</h2>
    <p>Hello,</p>
    <p>We received a request to reset your password for your Marketplace Platform account.</p>
    <a href="${resetUrl}" class="button">Reset Password</a>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666;">${resetUrl}</p>
    <p><strong>This link will expire in 1 hour.</strong></p>
    <div class="warning">
      <strong>⚠️ Didn't request this?</strong><br>
      If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
    </div>
    <div class="footer">
      <p>For security reasons, this link will only work once and expires in 1 hour.</p>
      <p>© ${new Date().getFullYear()} Marketplace Platform. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };

  try {
    // Check if email is configured
    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
      // Development mode: Log email instead of sending
      console.log('\n📧 ===== PASSWORD RESET EMAIL (Development Mode) =====');
      console.log(`To: ${email}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log('====================================================\n');
      return;
    }

    // Send email
    const info = await getTransporter().sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
    console.log(`   Message ID: ${info.messageId}`);
  } catch (error) {
    // Log error but don't throw - we don't want password reset request to fail if email fails
    console.error('❌ Failed to send password reset email:', error);
    console.error(`   Recipient: ${email}`);
    
    // In production, you might want to:
    // - Queue the email for retry
    // - Alert administrators
    // - Log to error tracking service (Sentry, etc.)
    throw new Error('Failed to send password reset email');
  }
}

/**
 * Future email functions will be added here:
 * - sendWelcomeEmail(email, username)
 * - sendMessageNotification(email, senderName)
 * - sendListingSoldNotification(email, listingTitle)
 */
