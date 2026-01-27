/**
 * POST /api/generate-overview
 * Generates a 3D isometric overview image of the full home
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateImage, generateImageFromPlan } from '@/lib/gemini';
import type {
    GenerateOverviewRequest,
    GenerateOverviewResponse
} from '@/types/project';

export async function POST(request: NextRequest): Promise<NextResponse<GenerateOverviewResponse>> {
    try {
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

        // Create professional architectural 3D overview prompt
        const enhancedPrompt = `RealEstateOS Architectural Visualization Engine - 3D ISOMETRIC HOME CUTAWAY

CORE OBJECTIVE:
Generate a unified, technically accurate 3D isometric cutaway of the ENTIRE home layout.
This is a technical architectural illustration, NOT a lifestyle photograph.

FLOOR PLAN SOURCE OF TRUTH (Follow Layout EXACTLY):
${body.overviewPrompt}

DESIGN SYSTEM IMPLEMENTATION:
- Flooring: ${body.designSystem.flooring}
- Palette: ${body.designSystem.wallColorPalette.join(', ')}
- Materials: ${body.designSystem.materialMood.join(', ')}
- Style: ${body.designSystem.overallStyle}

NON-NEGOTIABLE RENDERING RULES:
1. View: 45-degree Isometric Cutaway. Walls cut at 4-foot height.
2. Layout: ALL rooms must be shown in their correct relative positions (as described above).
3. Scale: Furniture scale must be accurate and consistent across the entire floor.
4. Consistency: Same flooring functionality and wall thickness throughout.
5. Staging:
   - Beds in bedrooms.
   - Cabinetry in kitchens.
   - Plumbing fixtures in bathrooms.
   - Sofas/seating in living areas.
   - NO people. NO pets. NO hands.
6. Lighting: Uniform "studio" top-down lighting to illuminate all rooms equally.
7. Style: High-fidelity architectural rendering. Clean lines. Realistic materials.

OUTPUT:
One high-resolution 3D isometric cutaway of the full home interior.`;

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
