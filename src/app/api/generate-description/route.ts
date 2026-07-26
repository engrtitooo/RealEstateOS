/**
 * POST /api/generate-description
 * Generates MLS-ready listing copy using Gemini
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTextModel, parseJsonResponse } from '@/lib/gemini';
import { verifyApiAuth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import type {
    GenerateDescriptionRequest,
    GenerateDescriptionResponse,
    ListingDescription,
    StyleType
} from '@/types/project';

// Style marketing keywords
const styleMarketingTerms: Record<StyleType, string[]> = {
    modern: ['sleek', 'contemporary', 'cutting-edge', 'sophisticated', 'streamlined'],
    classic: ['timeless', 'elegant', 'refined', 'gracious', 'distinguished'],
    luxury: ['opulent', 'prestigious', 'exquisite', 'lavish', 'exclusive'],
    minimalist: ['serene', 'uncluttered', 'zen-like', 'thoughtfully curated', 'pure'],
    scandinavian: ['light-filled', 'hygge', 'warmly minimal', 'natural', 'cozy'],
    industrial: ['urban chic', 'character-rich', 'loft-style', 'artisan', 'authentic'],
    bohemian: ['eclectic', 'artistic', 'worldly', 'free-spirited', 'vibrant'],
    coastal: ['breezy', 'sun-drenched', 'relaxed', 'resort-style', 'serene'],
    traditional: ['stately', 'classic', 'formal', 'handsome', 'enduring'],
    contemporary: ['of-the-moment', 'design-forward', 'chic', 'fresh', 'dynamic'],
};

export async function POST(request: NextRequest): Promise<NextResponse<GenerateDescriptionResponse>> {
    try {
        // Auth Guard
        const auth = await verifyApiAuth(request);
        if (!auth.authorized) {
            return NextResponse.json(
                { success: false, error: auth.error || 'Unauthorized' },
                { status: 401 }
            );
        }

        // Rate Limit Check
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        const rateCheck = checkRateLimit(`api_description:${ip}`, 10, 60 * 1000);
        if (!rateCheck.success) {
            return NextResponse.json(
                { success: false, error: 'Rate limit exceeded. Please wait a minute.' },
                { status: 429 }
            );
        }
        // Parse request body
        const body = await request.json() as GenerateDescriptionRequest;

        // Validate required fields
        if (!body.rooms || !Array.isArray(body.rooms) || body.rooms.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Rooms array is required' },
                { status: 400 }
            );
        }

        if (!body.designSystem || typeof body.designSystem !== 'object') {
            return NextResponse.json(
                { success: false, error: 'Design system is required' },
                { status: 400 }
            );
        }

        if (!body.layoutSummary || typeof body.layoutSummary !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Layout summary is required' },
                { status: 400 }
            );
        }

        if (!body.style) {
            return NextResponse.json(
                { success: false, error: 'Style is required' },
                { status: 400 }
            );
        }

        const model = getTextModel();

        // Build room summary
        const roomSummary = body.rooms.map(room =>
            `- ${room.name} (${room.approxSize} ${room.function} space)`
        ).join('\n');

        // Get style-specific marketing terms
        const marketingTerms = styleMarketingTerms[body.style] || styleMarketingTerms.modern;

        const prompt = `You are a senior real estate copywriter for top-tier brokerages like Sotheby's, Compass, and The Agency.

Using the following property details, write MLS-ready marketing copy:

PROPERTY ROOMS:
${roomSummary}

DESIGN SYSTEM:
- Style: ${body.style}
- Flooring: ${body.designSystem.flooring}
- Color Palette: ${body.designSystem.wallColorPalette.join(', ')}
- Materials: ${body.designSystem.materialMood.join(', ')}
- Furniture Style: ${body.designSystem.furnitureAesthetic}

LAYOUT:
${body.layoutSummary}

STYLE KEYWORDS TO INCORPORATE:
${marketingTerms.join(', ')}

REQUIREMENTS:
1. Write with a premium, aspirational tone that matches ${body.style} style
2. Open with a compelling headline that creates immediate desire
3. Describe the flow of the home and the lifestyle it enables
4. Highlight the kitchen, living areas, primary bedroom, and baths specifically
5. Sound human, elegant, and sales-driven - avoid clichés like "dream home"
6. Be specific about design elements without being technical
7. Create emotional connection through vivid but tasteful language

OUTPUT FORMAT (JSON only):
{
  "headline": "One to two sentence premium headline",
  "full": "150-250 word full description with natural paragraph breaks",
  "short": "Approximately 50 word version for ads and previews"
}

Output valid JSON only. No markdown. No explanatory text.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse the JSON response
        let description: ListingDescription;
        try {
            description = parseJsonResponse<ListingDescription>(responseText);

            // Validate structure
            if (!description.headline || !description.full || !description.short) {
                throw new Error('Invalid description structure');
            }
        } catch (parseError) {
            console.error('Failed to parse description response:', responseText);
            return NextResponse.json(
                { success: false, error: 'Failed to parse AI response. Please try again.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            description,
        });

    } catch (error) {
        console.error('Generate description error:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
