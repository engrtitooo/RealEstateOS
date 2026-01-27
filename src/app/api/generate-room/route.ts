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
Design System (MUST follow exactly):
- Flooring: ${designSystem.flooring}
- Wall Colors: ${designSystem.wallColorPalette.join(', ')}
- Lighting: ${designSystem.lightingTemperature} temperature, ${designSystem.lightingStyle}
- Furniture Style: ${designSystem.furnitureAesthetic}
- Materials: ${designSystem.materialMood.join(', ')}
- Overall Style: ${designSystem.overallStyle}
`.trim();

    const prompt = `You are a senior architectural visualization specialist creating prompts for professional real estate marketing renders.

Generate a detailed image prompt for a ${roomName} that is a ${approxSize}-sized ${roomFunction} space.

${designSystemText}

CRITICAL REQUIREMENTS FOR THE IMAGE PROMPT:
1. This is ARCHITECTURAL VISUALIZATION, not lifestyle photography
2. NO people, NO hands, NO lifestyle scenes
3. Wide-angle architectural lens perspective (equivalent to 16-24mm)
4. Eye-level camera height (approximately 4-5 feet)
5. Vertical lines must be straight (no lens distortion)
6. Professional real estate photography lighting
7. Furniture must be CORRECT for room function:
   - Bedroom = bed, nightstands, dresser, NOT kitchen items
   - Kitchen = cabinets, counters, appliances, NOT living room furniture
   - Bathroom = vanity, toilet, shower/tub, NOT bedroom furniture
   - Living Room = sofa, coffee table, entertainment, NOT cooking equipment
8. Furniture SCALE must match ${approxSize} room size
9. Clear circulation paths - no cluttered or cramped layouts
10. Materials must look buildable: real wood grain, stone veining, fabric texture
11. Magazine-quality architectural photography
12. Empty room staged professionally - no occupants

Room-specific requirements for ${roomFunction}:
${getRoomSpecificRequirements(roomFunction)}

Output ONLY the image generation prompt. 2-3 detailed sentences describing the architectural interior render. NO explanatory text.`;

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
