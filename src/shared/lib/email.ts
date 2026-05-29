import { Resend } from 'resend';

import { env } from '@src/env';
import { logger } from '@src/shared/logger/server';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const APP_NAME = 'MFSA';
const APP_URL = env.NEXT_PUBLIC_APP_URL?.toString() || 'http://localhost:3000';

interface EmailProps {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: EmailProps) {
  if (!resend) {
    logger.warn('[Email] Resend not configured, skipping email send');
    logger.debug(`[Email] Would send to: ${to}`);
    logger.debug(`[Email] Subject: ${subject}`);
    return { success: true };
  }

  try {
    const result = await resend.emails.send({
      from: `MFSA <noreply@resend.dev>`,
      to,
      subject,
      html,
    });

    if (result.error) {
      logger.error({ error: result.error, to }, '[Email] Error sending email');
      return { success: false, error: result.error };
    }

    logger.info({ to }, '[Email] Sent successfully');
    return { success: true };
  } catch (error) {
    logger.error({ error, to }, '[Email] Exception sending email');
    return { success: false, error };
  }
}

export async function sendVerificationEmail(
  email: string,
  code: string,
  type: 'LOGIN_MFA' | 'SETUP_MFA',
): Promise<{ success: boolean }> {
  const isSetup = type === 'SETUP_MFA';
  const subject = isSetup ? 'Verify your email to enable MFA' : 'Your MFA Verification Code';
  const title = isSetup ? 'Verify Your Email' : 'Your Verification Code';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa; margin: 0; padding: 20px; }
    .container { max-width: 480px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px; }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { font-size: 24px; font-weight: bold; color: #1f2937; }
    .title { font-size: 20px; font-weight: 600; color: #111827; margin: 16px 0 8px; }
    .content { color: #6b7280; line-height: 1.6; }
    .code-container { background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0; }
    .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937; }
    .expiry { font-size: 14px; color: #9ca3af; margin-top: 12px; }
    .footer { text-align: center; font-size: 12px; color: #9ca3af; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">${APP_NAME}</div>
    </div>
    <div class="title">${title}</div>
    <div class="content">
      ${
        isSetup
          ? `Enter the verification code below to enable two-factor authentication for your account.`
          : `Enter the verification code below to sign in to your account.`
      }
    </div>
    <div class="code-container">
      <div class="code">${code}</div>
      <div class="expiry">This code expires in 5 minutes</div>
    </div>
    <div class="footer">
      If you didn't request this, please ignore this email.
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to: email, subject, html });
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
): Promise<{ success: boolean }> {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa; margin: 0; padding: 20px; }
    .container { max-width: 480px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px; }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { font-size: 24px; font-weight: bold; color: #1f2937; }
    .title { font-size: 20px; font-weight: 600; color: #111827; margin: 16px 0 8px; }
    .content { color: #6b7280; line-height: 1.6; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 24px 0; font-weight: 500; }
    .expiry { font-size: 14px; color: #9ca3af; margin-top: 12px; }
    .footer { text-align: center; font-size: 12px; color: #9ca3af; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">${APP_NAME}</div>
    </div>
    <div class="title">Reset Your Password</div>
    <div class="content">
      You requested to reset your password. Click the button below to create a new password.
    </div>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>
    <div class="expiry">This link expires in 1 hour</div>
    <div class="footer">
      If you didn't request a password reset, please ignore this email or contact support.
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - MFSA',
    html,
  });
}

export async function sendWelcomeEmail(email: string, name: string): Promise<{ success: boolean }> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa; margin: 0; padding: 20px; }
    .container { max-width: 480px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px; }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { font-size: 24px; font-weight: bold; color: #1f2937; }
    .title { font-size: 20px; font-weight: 600; color: #111827; margin: 16px 0 8px; }
    .content { color: #6b7280; line-height: 1.6; }
    .footer { text-align: center; font-size: 12px; color: #9ca3af; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">${APP_NAME}</div>
    </div>
    <div class="title">Welcome, ${name}!</div>
    <div class="content">
      Your account has been created successfully. You can now sign in to access your dashboard and manage your association.
    </div>
    <div class="footer">
      Thank you for joining ${APP_NAME}!
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to: email,
    subject: `Welcome to ${APP_NAME}!`,
    html,
  });
}
