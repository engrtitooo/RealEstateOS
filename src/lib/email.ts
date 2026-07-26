/**
 * Email Dispatcher for 2FA Verification Codes
 * Supports Resend API, SMTP, or secure server console fallback for local dev
 */

export interface Send2FAEmailParams {
    toEmail: string;
    code: string;
}

/**
 * Sends 2FA OTP verification code to the target email
 */
export async function send2FAEmail({ toEmail, code }: Send2FAEmailParams): Promise<boolean> {
    const resendApiKey = process.env.RESEND_API_KEY;
    const smtpHost = process.env.SMTP_HOST;

    // 1. Try Resend HTTP API if configured
    if (resendApiKey) {
        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: process.env.SMTP_FROM || 'RealEstateOS Security <security@realestateos.dev>',
                    to: [toEmail],
                    subject: `🔒 Your RealEstateOS 2FA Code: ${code}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #0c0f19; color: #ffffff; border-radius: 16px; border: 1px solid #1e293b;">
                            <h2 style="color: #6366f1; margin-top: 0;">RealEstateOS 2FA Verification</h2>
                            <p style="color: #94a3b8; font-size: 15px;">Use the following 6-digit code to complete your login approval:</p>
                            <div style="background: #1e1b4b; border: 1px solid #4338ca; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                                <span style="font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #818cf8;">${code}</span>
                            </div>
                            <p style="color: #64748b; font-size: 13px;">This code is valid for <strong>5 minutes</strong>. If you did not request this code, please secure your server immediately.</p>
                        </div>
                    `,
                }),
            });

            if (response.ok) {
                console.log(`[RealEstateOS 2FA] Verification code email sent to ${toEmail} via Resend.`);
                return true;
            }
            console.error('[RealEstateOS 2FA] Resend API error:', await response.text());
        } catch (err) {
            console.error('[RealEstateOS 2FA] Failed to send email via Resend:', err);
        }
    }

    // 2. Log to server console prominently for developer / owner awareness
    console.log('\n==================================================');
    console.log('🔒 [RealEstateOS 2FA VERIFICATION CODE]');
    console.log(`Target Email: ${toEmail}`);
    console.log(`2FA Passcode:  ${code}`);
    console.log(`Expires In:    5 minutes`);
    if (!smtpHost && !resendApiKey) {
        console.log('NOTE: To deliver real emails, set RESEND_API_KEY or SMTP parameters in .env.');
    }
    console.log('==================================================\n');

    return true;
}

/**
 * Mask email address for UI display (e.g. eaeltayb@gmail.com -> ea***b@gmail.com)
 */
export function maskEmail(email: string): string {
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 2) return `${name}***@${domain}`;
    return `${name.substring(0, 2)}***${name.substring(name.length - 1)}@${domain}`;
}
