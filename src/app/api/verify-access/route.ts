/**
 * POST /api/verify-access
 * Step 1 of Authentication: Verifies primary Application Password
 * If valid, generates a 6-digit 2FA code, dispatches email to ADMIN_EMAIL, and returns a 2FA token
 */

import { NextRequest, NextResponse } from 'next/server';
import { create2FAChallenge } from '@/lib/auth';
import { send2FAEmail, maskEmail } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';

interface VerifyAccessRequest {
    code?: string;
    password?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // Rate Limit Check (max 5 login attempts per minute per IP)
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        const rateCheck = checkRateLimit(`login_step1:${ip}`, 5, 60 * 1000);
        if (!rateCheck.success) {
            return NextResponse.json(
                { success: false, error: 'Too many authentication attempts. Please wait 1 minute.' },
                { status: 429 }
            );
        }

        const body = (await request.json()) as VerifyAccessRequest;
        const inputPass = body.password || body.code;

        if (!inputPass || typeof inputPass !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Password is required' },
                { status: 400 }
            );
        }

        // Get configured app password from env
        const validPassword = process.env.APP_PASSWORD || process.env.ACCESS_CODE;
        if (!validPassword) {
            console.error('[RealEstateOS Security] APP_PASSWORD is not configured in .env file.');
            return NextResponse.json(
                { success: false, error: 'Server configuration error: APP_PASSWORD missing in .env' },
                { status: 500 }
            );
        }

        // Verify password (exact match)
        if (inputPass.trim() !== validPassword.trim()) {
            return NextResponse.json(
                { success: false, error: 'Invalid application password' },
                { status: 401 }
            );
        }

        // Target Email address for 2FA
        const adminEmail = process.env.ADMIN_EMAIL || 'eaeltayb@gmail.com';

        // Generate 6-digit random OTP code
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Save 2FA challenge token with 5-minute TTL
        const twoFactorToken = create2FAChallenge(otpCode, 5 * 60 * 1000);

        // Send 2FA Email
        await send2FAEmail({
            toEmail: adminEmail,
            code: otpCode,
        });

        return NextResponse.json({
            success: true,
            require2FA: true,
            twoFactorToken,
            emailMasked: maskEmail(adminEmail),
            message: `2FA verification code sent to ${maskEmail(adminEmail)}`,
        });

    } catch (error) {
        console.error('Verify access step 1 error:', error);
        return NextResponse.json(
            { success: false, error: 'An unexpected authentication error occurred' },
            { status: 500 }
        );
    }
}
