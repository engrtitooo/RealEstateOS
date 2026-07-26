/**
 * Centralized Authentication & Session Management Library
 * Handles HMAC-SHA256 signed session tokens, 2FA OTP store, and API route guards
 */

import { NextRequest } from 'next/server';

export const SESSION_COOKIE_NAME = 'realestateos_session';

interface OTPRecord {
    code: string;
    expiresAt: number;
    attempts: number;
}

// In-Memory store for active 2FA challenges
const otpStore = new Map<string, OTPRecord>();

// Cleanup expired 2FA challenges periodically
setInterval(() => {
    const now = Date.now();
    otpStore.forEach((record, token) => {
        if (now > record.expiresAt) {
            otpStore.delete(token);
        }
    });
}, 60 * 1000);

/**
 * Get secret key for HMAC token signing
 */
function getAuthSecret(): string {
    const secret = process.env.JWT_SECRET || process.env.APP_PASSWORD || process.env.ACCESS_CODE;
    if (!secret) {
        throw new Error('Security Error: Neither JWT_SECRET nor APP_PASSWORD is configured in environment.');
    }
    return secret;
}

/**
 * Generates an HMAC-SHA256 signature for a payload string
 */
async function generateHmacSignature(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(payload);

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    return Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Generates a signed session token: payload.signature
 */
export async function createSessionToken(userId: string = 'admin', ttlMs: number = 24 * 60 * 60 * 1000): Promise<string> {
    const secret = getAuthSecret();
    const expiresAt = Date.now() + ttlMs;
    const payload = `${userId}:${expiresAt}`;
    const signature = await generateHmacSignature(payload, secret);
    const token = `${Buffer.from(payload).toString('base64url')}.${signature}`;
    return token;
}

/**
 * Validates a signed session token
 */
export async function verifySessionToken(token: string): Promise<boolean> {
    try {
        if (!token || !token.includes('.')) return false;
        const [encodedPayload, signature] = token.split('.');
        const payload = Buffer.from(encodedPayload, 'base64url').toString('utf8');
        const [userId, expiresAtStr] = payload.split(':');

        if (!userId || !expiresAtStr) return false;

        const expiresAt = parseInt(expiresAtStr, 10);
        if (isNaN(expiresAt) || Date.now() > expiresAt) {
            return false;
        }

        const secret = getAuthSecret();
        const expectedSignature = await generateHmacSignature(payload, secret);

        return signature === expectedSignature;
    } catch {
        return false;
    }
}

/**
 * Store a 2FA challenge and return a temporary tracking token
 */
export function create2FAChallenge(code: string, ttlMs: number = 5 * 60 * 1000): string {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(24)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    otpStore.set(token, {
        code,
        expiresAt: Date.now() + ttlMs,
        attempts: 0,
    });

    return token;
}

/**
 * Verifies a 2FA challenge token and entered code
 */
export function verify2FAChallenge(token: string, inputCode: string): { success: boolean; error?: string } {
    const record = otpStore.get(token);

    if (!record) {
        return { success: false, error: '2FA session expired or invalid. Please login again.' };
    }

    if (Date.now() > record.expiresAt) {
        otpStore.delete(token);
        return { success: false, error: '2FA verification code has expired. Please request a new one.' };
    }

    record.attempts += 1;
    if (record.attempts > 5) {
        otpStore.delete(token);
        return { success: false, error: 'Too many incorrect attempts. Please login again.' };
    }

    if (record.code.trim() !== inputCode.trim()) {
        return { success: false, error: 'Incorrect 2FA verification code.' };
    }

    // Code matched! Clean up token.
    otpStore.delete(token);
    return { success: true };
}

/**
 * Server-side Guard for Protecting API Routes
 * Checks HttpOnly session cookie or Authorization header
 */
export async function verifyApiAuth(request: NextRequest): Promise<{ authorized: boolean; error?: string }> {
    // 1. Check HttpOnly cookie
    const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (cookieToken && (await verifySessionToken(cookieToken))) {
        return { authorized: true };
    }

    // 2. Check Authorization Header: Bearer <token>
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const bearerToken = authHeader.substring(7).trim();
        if (await verifySessionToken(bearerToken)) {
            return { authorized: true };
        }
    }

    // 3. Check X-Access-Token header
    const customHeader = request.headers.get('X-Access-Token');
    if (customHeader && (await verifySessionToken(customHeader))) {
        return { authorized: true };
    }

    return {
        authorized: false,
        error: 'Unauthorized: Authentication and 2FA approval required to consume this API.'
    };
}
