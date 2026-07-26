/**
 * POST /api/virtual-stage
 * Virtally stages an empty room photo while preserving geometry
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateImageFromPlan, auditEmptyRoom } from '@/lib/gemini';
import { verifyApiAuth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import type { DesignSystem } from '@/types/project';

interface VirtualStageRequest {
    photoBase64: string;
    roomType: string;
    designSystem: DesignSystem;
}

export async function POST(request: NextRequest) {
    try {
        // Auth Guard
        const auth = await verifyApiAuth(request);
        if (!auth.authorized) {
            return NextResponse.json(
                { success: false, error: auth.error || 'Unauthorized' },
                { status: 401 }
            );
        }

        // Rate Limit Check
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        const rateCheck = checkRateLimit(`api_virtualstage:${ip}`, 10, 60 * 1000);
        if (!rateCheck.success) {
            return NextResponse.json(
                { success: false, error: 'Rate limit exceeded. Please wait a minute.' },
                { status: 429 }
            );
        }
        const body = await request.json() as VirtualStageRequest;

        if (!body.photoBase64 || !body.roomType) {
            return NextResponse.json({ success: false, error: 'Missing photo or room type' }, { status: 400 });
        }

        // 1. Audit the Empty Room to lock geometry
        const cleanPhoto = body.photoBase64.replace(/^data:image\/\w+;base64,/, '');
        const geometryAudit = await auditEmptyRoom(cleanPhoto);

        // 2. Construct the Staging Prompt
        const prompt = `Role: High-Fidelity Virtual Staging AI.

Objective: Furnish this EXACT empty room.
Constraint: DO NOT CHANGE THE GEOMETRY.

INPUT DATA:
- Room Function: ${body.roomType}
- Style: ${body.designSystem.overallStyle}
- Geometric Scan: ${geometryAudit}

INSTRUCTIONS:
1. CAMERA LOCK: You MUST match the "Geometric Scan" camera angle relative to the walls exactly.
2. PRESERVATION: Keep the existing flooring and walls if they are good quality.
3. FURNISH: Place high-end ${body.designSystem.furnitureAesthetic} furniture in the empty voids.
   - If "Bedroom", place a bed against the logical wall.
   - If "Living Room", place a sofa facing the focal point.
4. LIGHTING: Match the "Lighting Direction" identified in the scan.

OUTPUT: A photorealistic staged version of the input photo.`;

        // 3. Generate Staged Image
        // We use generateImageFromPlan because it supports Image-to-Image with strong constraints
        const imageUrl = await generateImageFromPlan(
            cleanPhoto, // Treat photo as the "Plan" (Geometry Source)
            'image/png',
            prompt
        );

        return NextResponse.json({ success: true, imageUrl });

    } catch (error) {
        console.error('Virtual Staging Error:', error);
        return NextResponse.json({ success: false, error: 'Staging failed' }, { status: 500 });
    }
}
