/**
 * POST /api/verify-2fa
 * Step 2 of Authentication: Verifies the 6-digit Email 2FA OTP Code
 * Upon success, issues signed HttpOnly session cookie and session token
 */

import { NextRequest, NextResponse } from 'next/server';
import { verify2FAChallenge, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

interface Verify2FARequest {
    twoFactorToken: string;
    code: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        const rateCheck = checkRateLimit(`login_step2:${ip}`, 5, 60 * 1000);
        if (!rateCheck.success) {
            return NextResponse.json(
                { success: false, error: 'Too many 2FA attempts. Please wait 1 minute.' },
                { status: 429 }
            );
        }

        const body = (await request.json()) as Verify2FARequest;

        if (!body.twoFactorToken || !body.code) {
            return NextResponse.json(
                { success: false, error: 'Both 2FA session token and 6-digit code are required.' },
                { status: 400 }
            );
        }

        // Verify the 2FA challenge
        const result = verify2FAChallenge(body.twoFactorToken, body.code);
        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error || 'Invalid 2FA code.' },
                { status: 401 }
            );
        }

        // Generate signed session token (valid 24 hours)
        const sessionToken = await createSessionToken('admin', 24 * 60 * 60 * 1000);

        const response = NextResponse.json({
            success: true,
            message: '2FA Authentication successful!',
            token: sessionToken,
        });

        // Set HttpOnly, SameSite=Strict cookie
        response.cookies.set({
            name: SESSION_COOKIE_NAME,
            value: sessionToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 24 * 60 * 60, // 24 hours
        });

        return response;

    } catch (error) {
        console.error('Verify 2FA error:', error);
        return NextResponse.json(
            { success: false, error: 'An unexpected 2FA verification error occurred.' },
            { status: 500 }
        );
    }
}
