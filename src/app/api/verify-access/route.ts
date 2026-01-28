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

        // Get the access code from environment variable or use HARDCODED FALLBACK for hackathon safety
        const validCode = process.env.ACCESS_CODE || 'GEMINI2025';

        if (!validCode) {
            // Should never happen with fallback, but good practice to fail closed
            console.error('ACCESS_CODE not configured');
            return NextResponse.json(
                { success: false, error: 'System Configuration Error' },
                { status: 500 }
            );
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
