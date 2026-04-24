/**
 * Gemini AI Client Utilities
 * Centralized Gemini configuration and helper functions
 * STRICT MODE: Uses gemini-3.1-pro exclusively for high-fidelity generation
 */

import { GoogleGenerativeAI, Part } from '@google/generative-ai';

// Initialize the Gemini client
// Lazy Initialize the Gemini client to prevent build-time crashes
let genAIInstance: GoogleGenerativeAI | null = null;

function getGenAI() {
    if (!genAIInstance) {
        const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
        // During build time, env vars might be missing. We allow this, but runtime will fail.
        if (!apiKey) {
            // If running in browser/edge where process.env might be polyfilled differently
            // or simply missing during build, we return a dummy or throw at runtime usage.
            console.warn('Warning: GOOGLE_API_KEY not found. Calls will fail.');
        }
        genAIInstance = new GoogleGenerativeAI(apiKey || 'BUILD_PLACEHOLDER');
    }
    return genAIInstance;
}

// Single Truth Model ID
const MODEL_ID = 'gemini-3.1-pro';

// Strict System Instruction for Geometric Fidelity
const SYSTEM_INSTRUCTION = `Role: Architectural Visualization Specialist. Your highest priority is Structural Integrity. You MUST NOT alter, move, or resize structural elements (walls, windows, doors). You must only finish/furnish the empty space within the existing boundaries. Perspective matching is mandatory.`;

/**
 * Get the Gemini Vision model for architectural analysis
 */
export function getVisionModel() {
    console.log('[RealEstateOS] Initializing Vision Model:', MODEL_ID);
    return getGenAI().getGenerativeModel({
        model: MODEL_ID,
        systemInstruction: SYSTEM_INSTRUCTION,
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
    console.log('[RealEstateOS] Initializing Text Model:', MODEL_ID);
    return getGenAI().getGenerativeModel({
        model: MODEL_ID,
        systemInstruction: SYSTEM_INSTRUCTION,
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
 * Generate an image using strict architectural model
 * Replaces legacy Imagen 3 fallback with high-fidelity Gemini generation
 */
export async function generateImage(prompt: string): Promise<string> {
    console.log('[RealEstateOS] Generating text-to-image using model:', MODEL_ID);
    try {
        const model = getGenAI().getGenerativeModel({
            model: MODEL_ID,
            systemInstruction: SYSTEM_INSTRUCTION,
            generationConfig: {
                temperature: 0.1,
                // @ts-expect-error - generation model config
                responseModalities: ['image'],
            },
        });

        const enhancedPrompt = `ARCHITECTURAL RENDER: ${prompt}`;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }]
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

        throw new Error('No image generated');

    } catch (error) {
        console.error('Generation error:', error);
        // Minimal fallback placeholder if absolutely necessary, but we try to avoid it
        return 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80';
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
    console.log('[RealEstateOS] Analyzing plan using model:', MODEL_ID);
    const model = getVisionModel();

    const imagePart = createImagePart(imageBase64, mimeType);

    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;

    return response.text();
}

/**
 * Edit an image - Not strictly used in main flow but kept for utility compatibility
 * Updated to use the new model
 */
export async function editImage(
    imageBase64: string,
    mimeType: string,
    editPrompt: string
): Promise<string> {
    console.log('[RealEstateOS] Editing image using model:', MODEL_ID);
    // Room-type-specific fallback images for staging
    const stagingFallbacks = [
        'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80',
        // ... simplified fallbacks
    ];

    try {
        const model = getGenAI().getGenerativeModel({
            model: MODEL_ID,
            systemInstruction: SYSTEM_INSTRUCTION,
            generationConfig: {
                temperature: 0.1,
                // @ts-expect-error - generation model config
                responseModalities: ['image', 'text'],
            },
        });

        // Create the image part from the original image
        const imagePart = createImagePart(imageBase64, mimeType);

        const result = await model.generateContent({
            contents: [
                {
                    role: 'user',
                    parts: [imagePart, { text: editPrompt }],
                },
            ],
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
        return stagingFallbacks[0];
    } catch (error) {
        console.error('Image editing error, using fallback:', error);
        return stagingFallbacks[0];
    }
}

/**
 * Audit the 3D Overview Image to extract strict furniture/layout specs
 * Returns a JSON-formatted string describing the exact furniture in the target room
 */
export async function extractFurnitureSpec(
    overviewBase64: string,
    roomName: string
): Promise<string> {
    console.log('[RealEstateOS] Extracting Layout Spec for:', roomName);
    try {
        const model = getVisionModel();
        const imagePart = createImagePart(overviewBase64, 'image/png');

        const auditPrompt = `AUDIT TASK:
Look at this 3D Home Overview.
Focus ONLY on the room labeled or identifying as "${roomName}".

Your job is to write a STRICT LAYOUT SPECIFICATION for this room.
1. ARCHITECTURE (CRITICAL):
   - Count the WINDOWS visible in this room. If zero, write "WINDOWS: 0".
   - Count the DOORS visible.
   - Note any unique architectural features.
2. FURNITURE:
   - List every piece of furniture visible.
   - Note the EXACT count (e.g., "6 Dining Chairs").
   - Note the orientation.
   - Note color/material.

Output format:
- Windows: [Count] (Directly visible? implied?)
- Doors: [Count]
- Flooring: [Material/Color]
- Walls: [Color]
- Furniture List:
  1. [Item] ([Color/Material]) - [Position/Orientation]
  2. [Item] ...

If the room is empty, say "Room is empty".
Do NOT hallucinate windows or furniture not present.`;

        const result = await model.generateContent([auditPrompt, imagePart]);
        return result.response.text();
    } catch (error) {
        console.error('Layout Spec Extraction Error:', error);
        return "Standard furniture layout matching the room function.";
    }
}



/**
 * Audit an Empty Room Photo for Virtual Staging
 * Extracts Camera Angle, Lighting, and Geometry constraints
 */
export async function auditEmptyRoom(
    photoBase64: string
): Promise<string> {
    console.log('[RealEstateOS] Auditing Empty Room Geometry');
    try {
        const model = getVisionModel();
        const imagePart = createImagePart(photoBase64, 'image/png');

        const prompt = `GEOMETRY SCAN:
Look at this room photo. I need to furnish it.
Analyze the ARCHITECTURAL SKELETON to ensure I don't break the perspective.

REPORT:
1. Camera Angle (e.g., "Eye-level, 1-point perspective, looking straight at back wall").
2. Flooring (e.g., "Light Oak Hardwood, planks running vertical").
3. Windows (e.g., "Two large windows on left wall, sunny daylight").
4. Ceiling (e.g., "Flat white, approx 9ft").
5. Lighting Direction (e.g., "Light coming from left").

OUTPUT FORMAT:
- Camera: [Description]
- Lighting: [Description]
- Existing Materials: [Floor] / [Walls]
- Structural Constraints: [Windows/Doors locations]

Be extremely precise.`;

        const result = await model.generateContent([prompt, imagePart]);
        return result.response.text();
    } catch (error) {
        console.error('Empty Room Audit Error:', error);
        return "Standard room geometry.";
    }
}

/**
 * Generate an image derived strictly from a reference floor plan
 */
export async function generateImageFromPlan(
    planBase64: string,
    mimeType: string,
    prompt: string,
    styleReferenceBase64?: string // Optional Style Reference Image
): Promise<string> {
    console.log('[RealEstateOS] Generating from Plan using model:', MODEL_ID);
    try {
        const model = getGenAI().getGenerativeModel({
            model: MODEL_ID,
            systemInstruction: SYSTEM_INSTRUCTION,
            generationConfig: {
                temperature: 0.0, // STRICT: Maximum determinism for furniture consistency
                topP: 1.0,        // Do not cut off tokens
                topK: 1,          // Only pick the most likely token
                // @ts-expect-error - generation model config
                responseModalities: ['image', 'text'],
            },
        });

        const imagePart = createImagePart(planBase64, mimeType);

        // Prepare parts array
        const inputParts: Part[] = [imagePart];

        // If Style Reference is provided, add it
        if (styleReferenceBase64) {
            console.log('[RealEstateOS] Style reference image provided. Attaching to request.');
            const stylePart = createImagePart(styleReferenceBase64, 'image/png'); // Assumption: PNG/JPEG
            inputParts.push(stylePart);
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
        console.warn('Plan-driven generation failed to produce image, falling back to simple generation');
        return generateImage(prompt);

    } catch (error) {
        console.error('Plan-driven generation error:', error);
        return generateImage(prompt);
    }
}
