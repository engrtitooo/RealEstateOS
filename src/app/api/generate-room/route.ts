/**
 * POST /api/generate-room
 * Generates a photorealistic interior image for a specific room
 * Uses Gemini to create the prompt and Imagen to render
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTextModel, generateImage } from '@/lib/gemini';
import type {
    GenerateRoomRequest,
    GenerateRoomResponse,
    DesignSystem
} from '@/types/project';

// Create interior design prompt using Gemini
async function createInteriorPrompt(
    roomName: string,
    designSystem: DesignSystem,
    approxSize: 'small' | 'medium' | 'large',
    roomFunction: string
): Promise<string> {
    const model = getTextModel();

    const designSystemText = `
Design System:
- Flooring: ${designSystem.flooring}
- Wall Colors: ${designSystem.wallColorPalette.join(', ')}
- Lighting: ${designSystem.lightingTemperature} temperature, ${designSystem.lightingStyle}
- Furniture Style: ${designSystem.furnitureAesthetic}
- Materials: ${designSystem.materialMood.join(', ')}
- Overall Style: ${designSystem.overallStyle}
  `.trim();

    const prompt = `Write a photorealistic interior design prompt for generating an image of a ${roomName}.

Room Details:
- Function: ${roomFunction}
- Approximate Size: ${approxSize}

${designSystemText}

Requirements:
1. The prompt should describe an eye-level camera perspective
2. Follow the Design System strictly for all elements
3. The layout should be appropriate for a ${approxSize} ${roomFunction} room
4. This is a concept render derived from a floor plan—do not invent precise structural details such as exact window placement or ceiling height
5. Produce a professional, magazine-quality interior scene
6. Include specific furniture pieces, decor, and lighting fixtures that match the style
7. Describe the atmosphere, mood, and quality of light

Output ONLY the image generation prompt, nothing else. The prompt should be 2-3 detailed sentences.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}

export async function POST(request: NextRequest): Promise<NextResponse<GenerateRoomResponse>> {
    try {
        // Parse request body
        const body = await request.json() as GenerateRoomRequest;

        // Validate required fields
        if (!body.roomName || typeof body.roomName !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Room name is required' },
                { status: 400 }
            );
        }

        if (!body.designSystem || typeof body.designSystem !== 'object') {
            return NextResponse.json(
                { success: false, error: 'Design system is required' },
                { status: 400 }
            );
        }

        if (!['small', 'medium', 'large'].includes(body.approxSize)) {
            return NextResponse.json(
                { success: false, error: 'Invalid approxSize. Must be small, medium, or large' },
                { status: 400 }
            );
        }

        if (!body.function || typeof body.function !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Room function is required' },
                { status: 400 }
            );
        }

        // Generate the interior design prompt using Gemini
        const interiorPrompt = await createInteriorPrompt(
            body.roomName,
            body.designSystem,
            body.approxSize,
            body.function
        );

        // Generate the image using Imagen
        const imageUrl = await generateImage(interiorPrompt);

        return NextResponse.json({
            success: true,
            imageUrl,
            prompt: interiorPrompt,
        });

    } catch (error) {
        console.error('Generate room error:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
