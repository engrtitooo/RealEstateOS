/**
 * POST /api/analyze-plan
 * Analyzes a floor plan image using Gemini Vision
 * Returns rooms, design system, and overview prompt
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage, parseJsonResponse } from '@/lib/gemini';
import type {
    AnalyzePlanRequest,
    AnalyzePlanResponse,
    FloorPlanAnalysis,
    StyleType,
    DesignSystem,
    Room,
    RoomFunction
} from '@/types/project';

// Validate style input
const validStyles: StyleType[] = [
    'modern', 'classic', 'luxury', 'minimalist', 'scandinavian',
    'industrial', 'bohemian', 'coastal', 'traditional', 'contemporary'
];

function isValidStyle(style: string): style is StyleType {
    return validStyles.includes(style as StyleType);
}

// System prompt for professional architectural analysis
function getAnalysisPrompt(style: StyleType): string {
    return `You are RealEstateOS Architectural Visualization Engine, operating at professional architectural standards.
Your function is to convert an uploaded floor plan into accurate, market-grade analysis for architectural visualization.

Your highest priority is Spatial and Structural Fidelity.
You are not an artist. You are not a lifestyle photographer. You are a professional architectural renderer.

CORE OBJECTIVE:
Digitally "read" the provided floor plan to generate:
1. A complete 3D Home Overview description derived STRICTLY from the plan.
2. A list of REAL rooms mapped to their exact positions.
3. A cohesive design system specification.

NON-NEGOTIABLE CONSTRAINTS:
1. Geometry Lock: You MUST NOT alter, invent, move, resize, or reinterpret any structural element. Walls, doors, windows, and room boundaries must match the input exactly.
2. Plan Authority: The uploaded plan is the single source of truth. Do not create rooms that do not exist. Do not merge or split rooms.
3. Consistency: All rooms must belong to one coherent house with unified ceiling heights, material language, and architectural style (${style}).

OUTPUT REQUIREMENT:
Analyze this floor plan and return a strict JSON object containing:

1. "overviewPrompt" - A technical architectural description for the 3D home overview:
   - Describe the EXACT layout (north/south/east/west orientation).
   - "3D ISOMETRIC CUTAWAY" perspective.
   - Describe wall cuts at approximately 4 feet height.
   - Explicitly list which rooms connect to which.
   - NO people, NO lifestyle scenes. Architecture only.

2. "rooms" - Array of rooms EXACTLY as they appear in the floor plan:
   - "name": Exact room label from the plan.
   - "function": infer purely from the label (e.g., "Bedroom" -> "sleeping", "Kitchen" -> "cooking").
   - "approxSize": "small", "medium", or "large" based on visual proportion.
   - "position": Exact location description (e.g., "North-West corner, adjacent to Hallway").
   - "features": List ONLY structural features visible (e.g., "Bay window", "Double doors", "Island", "Built-in closet"). NO hallucinated features.

3. "designSystem" - Professional material specification for ${style} style:
   - "flooring": Precise material name (e.g., "Wide-plank European Oak").
   - "wallColorPalette": 3-4 architectural paint colors.
   - "lightingTemperature": "3000K warm-white" for residential.
   - "lightingStyle": Architectural fixtures (e.g., "Recessed gimbal", "Linear pendant").
   - "furnitureAesthetic": Professional staging furniture description.
   - "materialMood": 3 tactile materials (e.g., "Honed Carrara marble", "Matte black steel", "Boucle fabric").
   - "overallStyle": "${style}"

4. "layoutSummary": Brief professional architectural summary of the flow (e.g., "Split-bedroom layout with central open-plan gathering space").

5. "totalRoomCount": Integer count of rooms detected.

OUTPUT RULES:
- Valid JSON only.
- NO Markdown formatting.
- NO explanatory text.
- STRICT ADHERENCE to the floor plan geometry.`;
}

// Validate the parsed response structure
function validateAnalysis(data: unknown): data is FloorPlanAnalysis {
    if (!data || typeof data !== 'object') return false;

    const obj = data as Record<string, unknown>;

    if (typeof obj.overviewPrompt !== 'string') return false;
    if (!Array.isArray(obj.rooms)) return false;
    if (!obj.designSystem || typeof obj.designSystem !== 'object') return false;

    // Validate rooms
    for (const room of obj.rooms) {
        if (!room || typeof room !== 'object') return false;
        if (typeof room.name !== 'string') return false;
        if (typeof room.function !== 'string') return false;
        // Relax strict enum check to allow case variations (we normalize later)
        if (typeof room.approxSize !== 'string') return false;
    }

    // Validate design system
    const ds = obj.designSystem as Record<string, unknown>;
    if (typeof ds.flooring !== 'string') return false;
    if (!Array.isArray(ds.wallColorPalette)) return false;
    // Allow professional lighting descriptions (e.g. "3000K")
    if (typeof ds.lightingTemperature !== 'string') return false;

    return true;
}

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzePlanResponse>> {
    try {
        // Parse request body
        const body = await request.json() as AnalyzePlanRequest;

        // Validate required fields 
        if (!body.floorPlanBase64) {
            return NextResponse.json(
                { success: false, error: 'Floor plan image is required' },
                { status: 400 }
            );
        }

        if (!body.style || !isValidStyle(body.style)) {
            return NextResponse.json(
                { success: false, error: `Invalid style. Must be one of: ${validStyles.join(', ')}` },
                { status: 400 }
            );
        }

        if (!body.mimeType || !body.mimeType.startsWith('image/')) {
            return NextResponse.json(
                { success: false, error: 'Valid image mime type is required' },
                { status: 400 }
            );
        }

        // Generate the analysis prompt
        const prompt = getAnalysisPrompt(body.style);

        // Call Gemini Vision API
        const responseText = await analyzeImage(
            body.floorPlanBase64,
            body.mimeType,
            prompt
        );

        // Parse the JSON response
        let analysis: FloorPlanAnalysis;
        try {
            const parsed = parseJsonResponse<{
                overviewPrompt: string;
                rooms: Room[];
                designSystem: DesignSystem;
                layoutSummary?: string;
            }>(responseText);

            // Validate the response structure
            if (!validateAnalysis(parsed)) {
                throw new Error('Invalid response structure from AI');
            }

            // Normalize room sizes and functions to ensure they match expected values
            const normalizedRooms = parsed.rooms.map(room => {
                // Normalize size
                const lowerSize = String(room.approxSize).toLowerCase();
                let validSize: 'small' | 'medium' | 'large' = 'medium';
                if (lowerSize.includes('small')) validSize = 'small';
                else if (lowerSize.includes('large') || lowerSize.includes('huge') || lowerSize.includes('spacious')) validSize = 'large';
                else validSize = 'medium';

                // Normalize function (simple exact match attempt to standard keys, or fallback to original)
                // The prompt asks for specific keys, but we'll clean it just in case
                let validFunction = String(room.function).toLowerCase().trim();
                const standardFunctions = ['sleeping', 'cooking', 'living', 'dining', 'bathing', 'working', 'storage', 'utility', 'entertainment', 'outdoor'];

                // If the model returned "cooking area", find "cooking"
                const foundFunction = standardFunctions.find(f => validFunction.includes(f));
                if (foundFunction) validFunction = foundFunction;

                return {
                    ...room,
                    approxSize: validSize,
                    function: validFunction as RoomFunction
                };
            });

            analysis = {
                overviewPrompt: parsed.overviewPrompt,
                rooms: normalizedRooms,
                designSystem: {
                    ...parsed.designSystem,
                    overallStyle: body.style, // Ensure style matches request
                },
                layoutSummary: parsed.layoutSummary,
            };
        } catch (parseError) {
            console.error('Failed to parse Gemini response:', responseText);
            return NextResponse.json(
                { success: false, error: 'Failed to parse AI response. Please try again.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: analysis,
        });

    } catch (error) {
        console.error('Analyze plan error:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
