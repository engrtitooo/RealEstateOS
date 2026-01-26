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

        // Enhance the overview prompt with design system details
        const enhancedPrompt = `3D isometric architectural rendering, top-down view of a home interior layout:

${body.overviewPrompt}

Design Details:
- Flooring: ${body.designSystem.flooring}
- Color Palette: ${body.designSystem.wallColorPalette.join(', ')}
- Materials: ${body.designSystem.materialMood.join(', ')}
- Style: ${body.designSystem.overallStyle}

Requirements:
- Professional architectural visualization style
- Clean isometric 3D perspective from above
- Show all rooms with furniture placement
- Soft ambient lighting
- High-quality render with clean lines
- Magazine-quality presentation`;

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
