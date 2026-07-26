/**
 * GET /api/check-auth
 * Checks if the user is currently authenticated via the HttpOnly session cookie
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const authResult = await verifyApiAuth(request);
        return NextResponse.json({ authenticated: authResult.authorized });
    } catch (error) {
        console.error('Check Auth error:', error);
        return NextResponse.json({ authenticated: false });
    }
}
