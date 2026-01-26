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
    Room
} from '@/types/project';

// Validate style input
const validStyles: StyleType[] = [
    'modern', 'classic', 'luxury', 'minimalist', 'scandinavian',
    'industrial', 'bohemian', 'coastal', 'traditional', 'contemporary'
];

function isValidStyle(style: string): style is StyleType {
    return validStyles.includes(style as StyleType);
}

// System prompt for architectural analysis
function getAnalysisPrompt(style: StyleType): string {
    return `You are a licensed architect and interior designer with expertise in residential properties.

Analyze this floor plan image and return a strict JSON object containing:

1. "overviewPrompt" - A precise technical description suitable for generating a 3D isometric, top-down view of the full home layout. Include:
   - Overall shape and dimensions
   - Room arrangement and flow
   - Key architectural features
   - Style: ${style}

2. "rooms" - An array of detected rooms, each with:
   - "name": Specific room name (e.g., "Master Bedroom", "Kitchen", "Living Room")
   - "function": One of: "sleeping", "cooking", "living", "dining", "bathing", "working", "storage", "utility", "entertainment", "outdoor"
   - "approxSize": One of: "small", "medium", "large"

3. "designSystem" - A unified interior design specification for the "${style}" style:
   - "flooring": Specific flooring type (e.g., "wide-plank oak hardwood", "polished concrete")
   - "wallColorPalette": Array of 3-4 hex colors or color names
   - "lightingTemperature": One of: "warm", "neutral", "cool"
   - "lightingStyle": Specific style (e.g., "recessed LED with pendant accents")
   - "furnitureAesthetic": Description of furniture style
   - "materialMood": Array of 2-3 primary materials (e.g., ["walnut wood", "brushed steel", "marble"])
   - "overallStyle": "${style}"

4. "layoutSummary" - A brief 2-3 sentence description of the home's layout and flow.

CRITICAL: Output valid JSON only. No markdown code blocks. No explanatory text. Just the JSON object.`;
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
        if (!['small', 'medium', 'large'].includes(room.approxSize)) return false;
    }

    // Validate design system
    const ds = obj.designSystem as Record<string, unknown>;
    if (typeof ds.flooring !== 'string') return false;
    if (!Array.isArray(ds.wallColorPalette)) return false;
    if (!['warm', 'neutral', 'cool'].includes(ds.lightingTemperature as string)) return false;

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

            analysis = {
                overviewPrompt: parsed.overviewPrompt,
                rooms: parsed.rooms,
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
