/**
 * POST /api/stage-photo
 * Stages a room photo with AI-generated furniture
 * Preserves room geometry and camera angle
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage, getTextModel, generateImage } from '@/lib/gemini';
import type {
    StagePhotoRequest,
    StagePhotoResponse,
    StyleType
} from '@/types/project';

// Validate style input
const validStyles: StyleType[] = [
    'modern', 'classic', 'luxury', 'minimalist', 'scandinavian',
    'industrial', 'bohemian', 'coastal', 'traditional', 'contemporary'
];

function isValidStyle(style: string): style is StyleType {
    return validStyles.includes(style as StyleType);
}

// Style descriptions for staging
const styleDescriptions: Record<StyleType, string> = {
    modern: 'clean lines, neutral colors with bold accents, minimalist furniture, contemporary art',
    classic: 'traditional elegance, warm wood tones, ornate details, timeless furniture pieces',
    luxury: 'opulent materials like marble and gold accents, designer furniture, crystal lighting',
    minimalist: 'sparse furnishings, neutral palette, clean surfaces, focus on essential pieces only',
    scandinavian: 'light woods, white walls, cozy textiles, functional yet beautiful furniture',
    industrial: 'exposed brick, metal accents, raw materials, vintage-inspired furniture',
    bohemian: 'eclectic patterns, rich textures, global influences, layered decor',
    coastal: 'light blues and whites, natural textures, beach-inspired decor, airy feel',
    traditional: 'classic patterns, rich wood furniture, formal arrangement, elegant fabrics',
    contemporary: 'current trends, mixed materials, artistic elements, sophisticated color palettes',
};

// Analyze room geometry and generate staging prompt
async function analyzeRoomForStaging(
    imageBase64: string,
    mimeType: string,
    style: StyleType
): Promise<string> {
    const analysisPrompt = `You are an expert interior photographer and virtual staging specialist.

Analyze this room photo and identify:
1. Room type (living room, bedroom, kitchen, etc.)
2. Camera angle and perspective (eye-level, looking down, corner view, etc.)
3. Key architectural features (windows, doors, ceiling height, wall angles)
4. Lighting conditions (natural light direction, time of day feel)
5. Room dimensions estimate (small, medium, large)
6. Any existing elements that should be preserved

Based on this analysis, write a detailed image generation prompt that will create a staged version of this EXACT room with furniture and decor in the "${style}" style.

Style characteristics for ${style}: ${styleDescriptions[style]}

CRITICAL REQUIREMENTS:
1. The generated image MUST maintain the exact same camera angle and perspective
2. The room geometry, walls, windows, and architectural features must be preserved exactly
3. Only add furniture, decor, and styling - do not modify the room structure
4. Match the lighting conditions of the original photo
5. The staging should look photorealistic and professionally done

Output ONLY the image generation prompt, nothing else. Make it detailed and specific (3-4 sentences).`;

    const analysisResult = await analyzeImage(imageBase64, mimeType, analysisPrompt);
    return analysisResult.trim();
}

// Generate caption for staged room
async function generateCaption(
    style: StyleType,
    prompt: string
): Promise<string> {
    const model = getTextModel();

    const captionPrompt = `Based on this staging description, write a short professional caption (1-2 sentences) for a real estate listing:

Staging: ${prompt}
Style: ${style}

The caption should:
- Be elegant and sales-focused
- Highlight the style and atmosphere
- Appeal to potential home buyers
- Sound human and professional

Output ONLY the caption, nothing else.`;

    const result = await model.generateContent(captionPrompt);
    return result.response.text().trim();
}

export async function POST(request: NextRequest): Promise<NextResponse<StagePhotoResponse>> {
    try {
        // Parse request body
        const body = await request.json() as StagePhotoRequest;

        // Validate required fields
        if (!body.photoBase64) {
            return NextResponse.json(
                { success: false, error: 'Photo is required' },
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

        // Analyze room and generate staging prompt
        const stagingPrompt = await analyzeRoomForStaging(
            body.photoBase64,
            body.mimeType,
            body.style
        );

        // Generate the staged image using Imagen
        const imageUrl = await generateImage(stagingPrompt);

        // Optionally generate caption
        let caption: string | undefined;
        if (body.generateCaption) {
            caption = await generateCaption(body.style, stagingPrompt);
        }

        return NextResponse.json({
            success: true,
            imageUrl,
            caption,
        });

    } catch (error) {
        console.error('Stage photo error:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
