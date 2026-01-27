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
        const enhancedPrompt = `You are an architectural visualization engine. Use the uploaded floor plan as the single source of truth for geometry and layout. Generate one coherent, professionally designed 3D home interior overview that reflects the full plan.

Style: high-end ${body.designSystem.overallStyle} architectural interior design.
Flooring: ${body.designSystem.flooring}
Palette: ${body.designSystem.wallColorPalette.join(', ')}

Rendering requirements: photoreal archviz quality, realistic materials, correct scale, clean verticals, architectural wide-angle lens (18–24mm), ray-traced global illumination, ambient occlusion, texture-rich surfaces, realistic shadows, natural daylight + warm interior lighting balanced at ~3500–4000K, no people, no text, no watermark.

Non-negotiable: do not change the plan geometry. Do not add rooms or openings. Maintain consistent flooring and wall palette throughout the whole home.

Layout Context from Plan:
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
