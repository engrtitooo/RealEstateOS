/**
 * POST /api/generate-overview
 * Generates a 3D isometric overview image of the full home
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/gemini';
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
        const enhancedPrompt = `ARCHITECTURAL VISUALIZATION - 3D ISOMETRIC HOME INTERIOR CUTAWAY

SCENE TYPE: Professional architectural illustration showing the COMPLETE home interior from above at a 45-degree isometric angle. This is a technical architectural cutaway render, NOT a photograph.

FLOOR PLAN DESCRIPTION (follow exactly):
${body.overviewPrompt}

DESIGN SPECIFICATIONS:
- Flooring throughout: ${body.designSystem.flooring}
- Color Palette: ${body.designSystem.wallColorPalette.join(', ')}
- Material Finishes: ${body.designSystem.materialMood.join(', ')}
- Style: ${body.designSystem.overallStyle}

CRITICAL RENDERING REQUIREMENTS:
1. Show ALL rooms from the floor plan as a unified 3D cutaway
2. Walls cut at approximately 4 feet height to reveal interior
3. Each room must be correctly staged for its function (bedroom has bed, kitchen has cabinets, etc.)
4. Maintain consistent wall thickness, ceiling height, and architectural language
5. Flooring transitions between rooms should be logical and visible
6. NO people, NO lifestyle elements, architecture only
7. Clean isometric perspective with consistent 45-degree viewing angle
8. Soft ambient lighting from above, simulating natural daylight
9. Each room spatially connected as shown in the floor plan
10. Professional magazine-quality architectural illustration style
11. Show furniture to proper scale relative to room sizes
12. Clear circulation paths between rooms

OUTPUT: High-quality 3D isometric architectural cutaway illustration of the complete home interior.`;

        // Generate the overview image using Imagen
        const imageUrl = await generateImage(enhancedPrompt);

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
