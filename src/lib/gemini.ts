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
 */
export async function generateImage(prompt: string): Promise<string> {
    // Curated professional interior design images as fallback
    const fallbackImages = [
        'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
        'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&q=80',
    ];

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
        return fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
    } catch (error) {
        console.error('Imagen 3 generation error, using fallback:', error);
        return fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
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
