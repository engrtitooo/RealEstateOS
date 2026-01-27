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

// System prompt for professional architectural analysis
function getAnalysisPrompt(style: StyleType): string {
    return `You are a senior architectural visualization engine and licensed interior design director.
Your task is to analyze floor plans with professional precision for real estate marketing visualization.

CRITICAL RULES:
- The uploaded floor plan is the SINGLE SOURCE OF TRUTH
- Respect ALL room boundaries, dimensions, proportions, and adjacencies exactly as shown
- Do NOT invent layouts, walls, doors, or openings that don't exist in the plan
- Every room detected MUST correspond to a real room visible in the plan
- Room sizes must be proportional to what's shown in the floor plan

Analyze this floor plan and return a strict JSON object containing:

1. "overviewPrompt" - A PRECISE technical description for generating a 3D isometric cutaway view:
   - Describe the EXACT layout as shown in the plan (not invented)
   - Include room positions relative to each other (north/south/east/west or left/right/top/bottom)
   - Note adjacencies (which rooms share walls)
   - Describe the overall footprint shape
   - Style to apply: ${style}
   - This prompt will be used to generate an architectural 3D visualization, NOT a lifestyle photo

2. "rooms" - Array of rooms EXACTLY as they appear in the floor plan:
   - "name": Exact room label from the plan (e.g., "Primary Bedroom", "Kitchen", "Living Room", "Ensuite Bath")
   - "function": One of: "sleeping", "cooking", "living", "dining", "bathing", "working", "storage", "utility", "entertainment", "outdoor"
   - "approxSize": Based on floor plan proportions - "small", "medium", or "large"
   - "position": Brief description of room location (e.g., "northwest corner", "adjacent to kitchen")
   - "features": Notable features visible in plan (e.g., "walk-in closet", "ensuite access", "patio doors")

3. "designSystem" - Cohesive ${style} design specification:
   - "flooring": Primary flooring (e.g., "wide-plank white oak hardwood")
   - "wallColorPalette": Array of 3-4 specific colors that work with ${style}
   - "lightingTemperature": "warm", "neutral", or "cool"
   - "lightingStyle": Specific architectural lighting approach
   - "furnitureAesthetic": Furniture style matching ${style}
   - "materialMood": Array of 2-3 material finishes (e.g., ["matte walnut", "brushed brass", "white quartz"])
   - "overallStyle": "${style}"

4. "layoutSummary" - 2-3 sentences describing the floor plan's architectural flow and key features.

5. "totalRoomCount" - Integer count of rooms detected.

OUTPUT RULES:
- Valid JSON only. No markdown. No explanatory text.
- Only include rooms that are CLEARLY visible in the floor plan
- Do NOT hallucinate or invent rooms`;
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
