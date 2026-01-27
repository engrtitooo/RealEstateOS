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

        // Build style description from design system
        const styleDescription = `${body.designSystem.overallStyle} style with ${body.designSystem.flooring} flooring, ${body.designSystem.wallColorPalette.join('/')} wall palette, ${body.designSystem.furnitureAesthetic} furniture`;

        // Create professional architectural 3D overview prompt - USER PROVIDED TEMPLATE
        const enhancedPrompt = `Transform this schematic floor plan into a professional, photorealistic architectural top-down 2D/3D render.

Style: ${styleDescription}.

Requirements:
1. **FURNISH**: Add realistic furniture appropriate for each room (e.g., King bed in Master, Dining table in Dining area, Sofas in Living).
2. **TEXTURE**: Apply realistic flooring textures (wood, tile, carpet) and wall finishes.
3. **LIGHTING**: Add soft ambient lighting and shadows to create depth.
4. **ACCURACY**: Respect the exact wall layout, window positions, and door locations from the input schematic.

The output should look like a high-end real estate marketing floor plan.

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
