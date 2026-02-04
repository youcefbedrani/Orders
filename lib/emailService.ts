// Email service for sending verification codes
// Currently logs to console, can be upgraded to real email service later

export function generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

import nodemailer from 'nodemailer';

export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
    // Log to console for debugging
    console.log(`Sending verification code ${code} to ${email}`);

    try {
        // Create transporter
        // Default to MailHog (localhost:1025) if no env vars provided
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'localhost',
            port: parseInt(process.env.SMTP_PORT || '1025'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: process.env.SMTP_USER ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            } : undefined,
        });

        // Send email
        const info = await transporter.sendMail({
            from: `"${process.env.FROM_NAME || 'PixWarm'}" <${process.env.FROM_EMAIL || 'noreply@pixwarm.com'}>`,
            to: email,
            subject: 'Verify your PixWarm account',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h1 style="color: #4f46e5; margin: 0;">PixWarm</h1>
                    </div>
                    <div style="background-color: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        <h2 style="color: #1e293b; margin-top: 0; text-align: center;">Verify Your Email</h2>
                        <p style="font-size: 16px; color: #475569; text-align: center; margin-bottom: 32px;">
                            Thanks for signing up! Please use the verification code below to activate your account.
                        </p>
                        
                        <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px; border: 2px dashed #cbd5e1;">
                            <span style="font-family: monospace; font-size: 36px; font-weight: bold; color: #4f46e5; letter-spacing: 0.1em;">${code}</span>
                        </div>
                        
                        <p style="font-size: 14px; color: #64748b; text-align: center;">
                            This code will expire in 15 minutes. If you didn't create an account, you can safely ignore this email.
                        </p>
                    </div>
                    <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
                        &copy; ${new Date().getFullYear()} PixWarm. All rights reserved.
                    </div>
                </div>
            `
        });

        console.log('Message sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Failed to send email:', error);
        // Fallback to console log if email fails, so development isn't blocked 
        console.log(`fallback_code: ${code}`);
        return false;
    }
}

export function getCodeExpiryTime(): Date {
    return new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
}
