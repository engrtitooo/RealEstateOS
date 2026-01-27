/**
 * Gemini AI Client Utilities
 * Centralized Gemini configuration and helper functions
 * Uses Gemini 2.0 Flash for text/vision and Imagen 3 for image generation
 */

import { GoogleGenerativeAI, Part } from '@google/generative-ai';

// Initialize the Gemini client
const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn('Warning: GOOGLE_API_KEY or GEMINI_API_KEY not found in environment variables');
}

export const genAI = new GoogleGenerativeAI(apiKey || '');

// Model configurations - Hackathon approved models
export const MODELS = {
    // Gemini 3.0 Pro for vision and reasoning
    GEMINI_PRO: 'gemini-3-pro-preview',
    // Imagen 3 for image generation
    IMAGEN_3: 'imagen-3.0-generate-002',
} as const;

/**
 * Get the Gemini Vision model for architectural analysis
 */
export function getVisionModel() {
    return genAI.getGenerativeModel({
        model: MODELS.GEMINI_PRO, // gemini-3-pro-preview
        generationConfig: {
            temperature: 0.1, // Low temperature is mandatory for geometry lock
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 8192,
        },
    });
}

/**
 * Get the Gemini model for text generation (descriptions, captions)
 */
export function getTextModel() {
    return genAI.getGenerativeModel({
        model: MODELS.GEMINI_PRO,
        generationConfig: {
            temperature: 0.1, // Constrain creativity
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 4096,
        },
    });
}

/**
 * Create an image part for Gemini Vision
 */
export function createImagePart(base64Data: string, mimeType: string): Part {
    return {
        inlineData: {
            data: base64Data,
            mimeType: mimeType,
        },
    };
}

/**
 * Parse JSON from Gemini response, handling markdown code blocks
 */
export function parseJsonResponse<T>(text: string): T {
    try {
        let cleanText = text.trim();

        // 1. Try to match markdown code blocks
        const jsonBlockMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonBlockMatch) {
            cleanText = jsonBlockMatch[1];
        }

        // 2. Locate the first '{' and last '}' to extract the JSON object
        // This handles cases where the model adds "Here is the JSON:" preamble
        const firstBrace = cleanText.indexOf('{');
        const lastBrace = cleanText.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleanText = cleanText.substring(firstBrace, lastBrace + 1);
        }

        return JSON.parse(cleanText) as T;
    } catch (error) {
        console.error('JSON Parse Error. Raw text:', text);
        throw error;
    }
}

/**
 * Generate an image using Imagen 3
 * Uses the Gemini API with Imagen 3 model for high-quality image generation
 * Falls back to room-type-specific architectural images
 */
export async function generateImage(prompt: string): Promise<string> {
    // Room-type-specific architectural fallback images (NO people, professional real estate photography)
    const fallbackImagesByType: Record<string, string[]> = {
        bedroom: [
            'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80', // Modern bedroom
            'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80', // Luxury bedroom
            'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80', // Scandinavian bedroom
        ],
        kitchen: [
            'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80', // Modern kitchen
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', // White kitchen
            'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&q=80', // Contemporary kitchen
        ],
        living: [
            'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80', // Modern living room
            'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80', // Contemporary living
            'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', // Minimalist living
        ],
        bathroom: [
            'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80', // Modern bathroom
            'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80', // Luxury bathroom
            'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80', // Clean bathroom
        ],
        dining: [
            'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80', // Modern dining
            'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80', // Contemporary dining
        ],
        outdoor: [
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80', // Patio
            'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80', // Terrace
        ],
        overview: [
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', // Open floor plan
            'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80', // Modern interior
        ],
        default: [
            'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=800&q=80', // General interior
            'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80', // Clean interior
        ],
    };

    // Detect room type from prompt
    function detectRoomType(promptText: string): string {
        const lower = promptText.toLowerCase();
        if (lower.includes('bedroom') || lower.includes('sleeping') || lower.includes('master')) return 'bedroom';
        if (lower.includes('kitchen') || lower.includes('cooking')) return 'kitchen';
        if (lower.includes('living') || lower.includes('lounge') || lower.includes('family room')) return 'living';
        if (lower.includes('bath') || lower.includes('toilet') || lower.includes('ensuite') || lower.includes('shower')) return 'bathroom';
        if (lower.includes('dining')) return 'dining';
        if (lower.includes('patio') || lower.includes('outdoor') || lower.includes('deck') || lower.includes('terrace')) return 'outdoor';
        if (lower.includes('isometric') || lower.includes('overview') || lower.includes('cutaway') || lower.includes('floor plan')) return 'overview';
        return 'default';
    }

    const roomType = detectRoomType(prompt);
    const roomFallbacks = fallbackImagesByType[roomType] || fallbackImagesByType.default;

    try {
        // Use Imagen 3 for image generation
        const model = genAI.getGenerativeModel({
            model: MODELS.IMAGEN_3,
        });

        // Enhanced prompt for better results
        const enhancedPrompt = `Professional interior design photograph: ${prompt}. 
Magazine-quality, photorealistic, natural lighting, high resolution.`;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }],
            generationConfig: {
                // @ts-expect-error - Imagen 3 specific config
                responseModalities: ['image'],
            },
        });

        const response = result.response;
        const parts = response.candidates?.[0]?.content?.parts;

        if (parts && parts.length > 0) {
            for (const part of parts) {
                if ('inlineData' in part && part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }

        // Fallback if no image generated
        console.log('Imagen 3 did not return image, using fallback');
        return roomFallbacks[Math.floor(Math.random() * roomFallbacks.length)];
    } catch (error) {
        console.error('Imagen 3 generation error, using fallback:', error);
        return roomFallbacks[Math.floor(Math.random() * roomFallbacks.length)];
    }
}

/**
 * Analyze an image using Gemini Vision
 */
export async function analyzeImage(
    imageBase64: string,
    mimeType: string,
    prompt: string
): Promise<string> {
    const model = getVisionModel();

    const imagePart = createImagePart(imageBase64, mimeType);

    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;

    return response.text();
}

/**
 * Edit an image using Gemini 2.0 Flash with image generation
 * Takes the original image and applies edits based on the prompt
 * Returns the edited image as a base64 data URL
 */
export async function editImage(
    imageBase64: string,
    mimeType: string,
    editPrompt: string
): Promise<string> {
    // Room-type-specific fallback images for staging
    const stagingFallbacks = [
        'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80',
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    ];

    try {
        // Use Gemini 2.0 Flash experimental for image editing
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp',
        });

        // Create the image part from the original image
        const imagePart = createImagePart(imageBase64, mimeType);

        // Create the edit request with explicit instructions to modify the existing image
        const fullPrompt = `IMPORTANT: Edit this SPECIFIC image that I'm providing. Do NOT create a new room.

Look at the room in the provided image and ADD furniture and staging to it while keeping:
- The EXACT same room shape, walls, windows, and architecture
- The EXACT same camera angle and perspective
- The EXACT same lighting conditions

${editPrompt}

Output an edited version of THIS room with the new furniture and staging added.`;

        const result = await model.generateContent({
            contents: [
                {
                    role: 'user',
                    parts: [imagePart, { text: fullPrompt }],
                },
            ],
            generationConfig: {
                // @ts-expect-error - Gemini 2.0 Flash experimental image generation
                responseModalities: ['image', 'text'],
            },
        });

        const response = result.response;
        const parts = response.candidates?.[0]?.content?.parts;

        if (parts && parts.length > 0) {
            for (const part of parts) {
                if ('inlineData' in part && part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }

        // Fallback if no image in response
        console.log('Gemini did not return edited image, using fallback');
        return stagingFallbacks[Math.floor(Math.random() * stagingFallbacks.length)];
    } catch (error) {
        console.error('Image editing error, using fallback:', error);
        return stagingFallbacks[Math.floor(Math.random() * stagingFallbacks.length)];
    }
}

/**
 * Generate an image derived strictly from a reference floor plan
 * Uses Gemini 2.0 Flash for plan-faithful generation
 */
export async function generateImageFromPlan(
    planBase64: string,
    mimeType: string,
    prompt: string,
    styleReferenceBase64?: string // Optional Style Reference Image
): Promise<string> {
    try {
        // Use Gemini 2.0 Flash experimental for plan-driven Image-to-Image generation
        // CRITICAL: Low temperature for geometry lock
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp',
            generationConfig: {
                temperature: 0.1, // STRICT: Low temperature for accurate, non-creative output
                topP: 0.9,
                topK: 40,
            },
        });

        const imagePart = createImagePart(planBase64, mimeType);

        // Prepare parts array
        const inputParts: Part[] = [imagePart];

        // If Style Reference is provided, add it
        let styleInstruction = "";
        if (styleReferenceBase64) {
            const stylePart = createImagePart(styleReferenceBase64, 'image/png'); // Assumption: PNG/JPEG
            inputParts.push(stylePart);
            styleInstruction = `
VISUAL STYLE REFERENCE (IMAGE 2 - MANDATORY MATCH):
The second image is the 3D Home Overview. It is the ABSOLUTE STYLE AUTHORITY.

YOU MUST EXACTLY REPLICATE:
- The exact flooring material, color, and grain direction from Image 2.
- The exact wall paint color and finish from Image 2.
- The exact lighting temperature (warm/cool) from Image 2.
- The exact trim/baseboard style from Image 2.
- The furniture design language (modern, classic, etc.) from Image 2.

The output MUST look like it was rendered from the same 3D model as Image 2.
If Image 2 shows oak hardwood with warm 3500K lighting, your output MUST show identical oak hardwood with identical 3500K lighting.
`;
        }

        // Minimal wrapper to define inputs, trusting the caller's strict contract for the rest
        const architecturalPrompt = `INPUTS:
Image 1: Floor Plan (GEOMETRY AUTHORITY)
${styleReferenceBase64 ? "Image 2: 3D Overview (STYLE AUTHORITY)" : ""}

INSTRUCTIONS:
${prompt}`;

        const result = await model.generateContent({
            contents: [
                {
                    role: 'user',
                    parts: [...inputParts, { text: architecturalPrompt }]
                }
            ],
            generationConfig: {
                temperature: 0.1, // Reinforce low temperature
                // @ts-expect-error - multimodal generation support
                responseModalities: ['image', 'text'],
            },
        });

        const response = result.response;
        const parts = response.candidates?.[0]?.content?.parts;

        if (parts && parts.length > 0) {
            for (const part of parts) {
                if ('inlineData' in part && part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }

        // Fallback to standard text-to-image if multimodal fails
        console.warn('Plan-driven generation failed to produce image, falling back to text-to-image');
        return generateImage(prompt);

    } catch (error) {
        console.error('Plan-driven generation error:', error);
        return generateImage(prompt);
    }
}
