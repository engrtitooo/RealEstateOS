/**
 * In-Memory Sliding Window Rate Limiter
 * Protects API routes and authentication endpoints against abuse & brute-force
 */

interface RateLimitRecord {
    count: number;
    resetTime: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Cleanup stale records every 5 minutes
setInterval(() => {
    const now = Date.now();
    memoryStore.forEach((record, key) => {
        if (now > record.resetTime) {
            memoryStore.delete(key);
        }
    });
}, 5 * 60 * 1000);

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetMs: number;
}

/**
 * Checks rate limit for a given identifier key
 * @param key Unique key (e.g. `login:127.0.0.1` or `api:analyze-plan:sessionId`)
 * @param limit Max requests allowed in window
 * @param windowMs Time window in milliseconds (default 60000ms = 1 min)
 */
export function checkRateLimit(
    key: string,
    limit: number = 10,
    windowMs: number = 60 * 1000
): RateLimitResult {
    const now = Date.now();
    const record = memoryStore.get(key);

    if (!record || now > record.resetTime) {
        memoryStore.set(key, {
            count: 1,
            resetTime: now + windowMs,
        });
        return {
            success: true,
            remaining: limit - 1,
            resetMs: windowMs,
        };
    }

    if (record.count >= limit) {
        return {
            success: false,
            remaining: 0,
            resetMs: record.resetTime - now,
        };
    }

    record.count += 1;
    return {
        success: true,
        remaining: limit - record.count,
        resetMs: record.resetTime - now,
    };
}
