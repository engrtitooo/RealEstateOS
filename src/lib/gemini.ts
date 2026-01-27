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
        model: MODELS.GEMINI_PRO,
        generationConfig: {
            temperature: 0.4,
            topP: 0.95,
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
            temperature: 0.7,
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
    // Remove markdown code blocks if present
    let cleanText = text.trim();

    // Handle ```json ... ``` blocks
    if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    return JSON.parse(cleanText) as T;
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
