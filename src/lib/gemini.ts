/**
 * Gemini AI Client Utilities
 * Centralized Gemini configuration and helper functions
 */

import { GoogleGenerativeAI, Part } from '@google/generative-ai';

// Initialize the Gemini client
const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn('Warning: GOOGLE_API_KEY or GEMINI_API_KEY not found in environment variables');
}

export const genAI = new GoogleGenerativeAI(apiKey || '');

// Model configurations
export const MODELS = {
    // Gemini 2.0 Flash for vision and reasoning
    VISION: 'gemini-2.0-flash-exp',
    // Imagen 3 for image generation
    IMAGEN: 'imagen-3.0-generate-002',
} as const;

/**
 * Get the Gemini Vision model for architectural analysis
 */
export function getVisionModel() {
    return genAI.getGenerativeModel({
        model: MODELS.VISION,
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
        model: MODELS.VISION,
        generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 4096,
        },
    });
}

/**
 * Get the Imagen model for image generation
 */
export function getImagenModel() {
    return genAI.getGenerativeModel({
        model: MODELS.IMAGEN,
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
 */
export async function generateImage(prompt: string): Promise<string> {
    try {
        const model = getImagenModel();

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                // @ts-expect-error - Imagen specific config
                responseModalities: ['image'],
                responseMimeType: 'image/png',
            },
        });

        const response = result.response;
        const parts = response.candidates?.[0]?.content?.parts;

        if (parts && parts.length > 0) {
            const imagePart = parts[0];
            if ('inlineData' in imagePart && imagePart.inlineData) {
                // Return base64 data URL
                return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
            }
        }

        throw new Error('No image generated in response');
    } catch (error) {
        console.error('Imagen generation error:', error);
        throw error;
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
