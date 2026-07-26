/**
 * POST /api/generate-overview
 * Generates a 3D isometric overview image of the full home
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateImage, generateImageFromPlan } from '@/lib/gemini';
import { verifyApiAuth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import type {
    GenerateOverviewRequest,
    GenerateOverviewResponse
} from '@/types/project';

export async function POST(request: NextRequest): Promise<NextResponse<GenerateOverviewResponse>> {
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
        const rateCheck = checkRateLimit(`api_overview:${ip}`, 10, 60 * 1000);
        if (!rateCheck.success) {
            return NextResponse.json(
                { success: false, error: 'Rate limit exceeded. Please wait a minute.' },
                { status: 429 }
            );
        }
        // Parse request body
        const body = await request.json() as GenerateOverviewRequest;

        // Validate required fields
        if (!body.overviewPrompt || typeof body.overviewPrompt !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Overview prompt is required' },
                { status: 400 }
            );
        }

        if (!body.designSystem || typeof body.designSystem !== 'object') {
            return NextResponse.json(
                { success: false, error: 'Design system is required' },
                { status: 400 }
            );
        }

        // Build style description from design system
        const styleDescription = `${body.designSystem.overallStyle} style with ${body.designSystem.flooring} flooring, ${body.designSystem.wallColorPalette.join('/')} wall palette, ${body.designSystem.furnitureAesthetic} furniture`;

        // Create professional architectural 3D overview prompt - STRICT GEOMETRIC FIDELITY CONTRACT
        const enhancedPrompt = `Role:
You are a Professional Architectural Visualization Engine used in real estate marketing. Your highest priority is Geometric Fidelity. You are not allowed to redesign layouts. You only finish what already exists.

Objective:
Transform the provided floor plan into a single 3D Home Overview (top-down, professional, hyper-realistic).

Non-Negotiable Rules:
1. Geometry Lock: Walls, doors, windows, corridors, and room boundaries MUST match the input plan exactly. You may NOT move, resize, remove, or invent any wall, door, or room.
2. Single Source of Truth: Treat this Overview as the master model.
3. No Hallucination: Do NOT add rooms, windows, or architectural features that are not present.

Rendering Process:
Step 1 – Analyze: Identify room polygons, wall thickness, and openings.
Step 2 – Construct: Build a 3D model by extruding the exact geometry of the plan.
Step 3 – Style Application: Apply a unified, high-end ${body.designSystem.overallStyle} interior style.
   - Flooring: ${body.designSystem.flooring}
   - Palette: ${body.designSystem.wallColorPalette.join(', ')}
Step 4 – Furnish: Place furniture inside each room boundary only.
Step 5 – Output: 3D Home Overview. Orthographic top-down. Hyper-realistic. Shows the entire house.

Quality Target:
8K resolution, texture-rich surfaces, ambient occlusion, soft global illumination, realistic shadows, physically correct lighting, hyper-realistic materials.

Layout Context from Analysis:
${body.overviewPrompt}`;

        // Generate the overview image using Gemini 2.0 Flash (Plan-Driven) or Imagen (Text-Only fallback)
        let imageUrl: string;

        if (body.floorPlanBase64) {
            // Plan-Driven Flow (Visual Plan -> 3D Model)
            imageUrl = await generateImageFromPlan(
                body.floorPlanBase64,
                'image/png', // Default assumption, or pass mimeType in request if added
                enhancedPrompt
            );
        } else {
            // Text-Only Fallback (Legacy)
            imageUrl = await generateImage(enhancedPrompt);
        }

        return NextResponse.json({
            success: true,
            imageUrl,
        });

    } catch (error) {
        console.error('Generate overview error:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
