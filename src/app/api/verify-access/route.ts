/**
 * POST /api/verify-access
 * Verifies the access code for protected access to the app
 */

import { NextRequest, NextResponse } from 'next/server';

interface VerifyAccessRequest {
    code: string;
}

interface VerifyAccessResponse {
    success: boolean;
    error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<VerifyAccessResponse>> {
    try {
        const body = await request.json() as VerifyAccessRequest;

        if (!body.code || typeof body.code !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Access code is required' },
                { status: 400 }
            );
        }

        // Get the access code from environment variable
        const validCode = process.env.ACCESS_CODE;

        if (!validCode) {
            // If no access code is configured, allow access (for development)
            console.warn('ACCESS_CODE environment variable not set - allowing all access');
            return NextResponse.json({ success: true });
        }

        // Verify the code (case-insensitive)
        if (body.code.trim().toUpperCase() === validCode.toUpperCase()) {
            return NextResponse.json({ success: true });
        }

        return NextResponse.json(
            { success: false, error: 'Invalid access code' },
            { status: 401 }
        );

    } catch (error) {
        console.error('Verify access error:', error);
        return NextResponse.json(
            { success: false, error: 'An error occurred' },
            { status: 500 }
        );
    }
}
