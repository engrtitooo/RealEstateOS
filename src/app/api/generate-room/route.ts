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

// Create professional architectural interior design prompt
async function createInteriorPrompt(
    roomName: string,
    designSystem: DesignSystem,
    approxSize: 'small' | 'medium' | 'large',
    roomFunction: string
): Promise<string> {
    const model = getTextModel();

    const designSystemText = `
Design System Specification (STRICT ADHERENCE):
- Flooring: ${designSystem.flooring}
- Wall Colors: ${designSystem.wallColorPalette.join(', ')}
- Lighting: ${designSystem.lightingTemperature}, ${designSystem.lightingStyle}
- Furniture Style: ${designSystem.furnitureAesthetic}
- Material Finishes: ${designSystem.materialMood.join(', ')}
- Architecture Style: ${designSystem.overallStyle}
`.trim();

    const prompt = `You are RealEstateOS Architectural Visualization Engine.
Your task is to generate a technical image prompt for a single room render.

Target Room: ${roomName} (${approxSize} size, function: ${roomFunction})

${designSystemText}

NON-NEGOTIABLE RENDER SETTINGS:
1. Camera: Professional Architectural 24mm lens. Eye-level (5 feet). 2-point perspective. Vertical lines MUST be perfectly straight.
2. Lighting: Natural sunlight from windows + architectural fixture lighting. No exaggerated "bloom".
3. Staging: Professional real estate staging only.
   - Correct scale for ${approxSize} room.
   - Furniture MUST match function: ${roomFunction}.
   - Clear circulation paths.
4. Reality Check:
   - NO people. NO pets. NO hands.
   - NO lifestyle clutter (no open books, no half-eaten food).
   - Materials must look physically buildable (real wood grain, correct reflection).

Room-Specific Staging Rules for ${roomFunction}:
${getRoomSpecificRequirements(roomFunction)}

OUTPUT:
Generate ONE detailed image prompt (3-4 sentences) describing this specific room architecture and staging.
Focus on geometry, lighting, materials, and furniture.
NO introductory text. NO "Here is the prompt".`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}

// Room-specific staging requirements
function getRoomSpecificRequirements(roomFunction: string): string {
    const requirements: Record<string, string> = {
        sleeping: 'Include a properly sized bed (queen/king for primary, twin/full for secondary), nightstands, soft ambient lighting, calm color palette. NO kitchen appliances.',
        cooking: 'Show countertops, cabinetry, sink, and cooking appliances. Clean surfaces, architectural lighting above island/counters. NO bedroom furniture.',
        living: 'Feature seating arrangement (sofa, armchairs), coffee table, entertainment area. Natural light from windows. NO kitchen or bathroom fixtures.',
        dining: 'Include dining table with chairs, pendant lighting above table, possibly a sideboard. Formal or casual depending on style. NO beds or cooking equipment.',
        bathing: 'Show vanity with sink, mirror, toilet (can be out of frame), shower or tub. Clean tile work, proper bathroom fixtures. NO bedroom or kitchen items.',
        working: 'Include desk, office chair, task lighting, bookshelves or storage. Professional but personalized. NO bathroom fixtures.',
        storage: 'Show organized shelving, storage systems, good lighting. Functional and clean.',
        utility: 'Display laundry appliances, utility sink if applicable, organized storage. Practical lighting.',
        entertainment: 'Feature comfortable seating, media equipment area, ambient lighting. Welcoming atmosphere.',
        outdoor: 'Show patio furniture, outdoor lighting, landscaping visible. Weather-appropriate staging.',
    };
    return requirements[roomFunction] || 'Stage appropriately for the room function with correct furniture types.';
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
