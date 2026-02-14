import type { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redis } from '../../lib/redis';
import { apiError } from '../errors/ApiError';

// ---------- helpers ----------
function clientIp(req: Request) {
    return req.ip || req.socket.remoteAddress || 'unknown';
}

function keyByIp(req: Request) {
    return `ip:${clientIp(req)}`;
}

function keyByUserOrIp(req: Request) {
    const userId = (req as any).user?.id as string | undefined;
    return userId ? `u:${userId}` : keyByIp(req);
}

function usernameKey(req: Request) {
    const username = String((req as any).body?.username ?? '')
        .trim()
        .toLowerCase();
    return `u:${username || 'unknown'}`;
}

// ---------- GENERAL limiter ----------
const generalLimiter = new RateLimiterRedis({
    storeClient: redis as any,
    keyPrefix: 'rl:api',
    points: 120,
    duration: 60, // 300 req / minute
});

export async function generalRateLimit(
    req: Request,
    _res: Response,
    next: NextFunction,
) {
    if (req.path.startsWith('/auth')) return next();

    try {
        await generalLimiter.consume(keyByUserOrIp(req), 1);
        return next();
    } catch {
        return next(apiError(429, 'TOO_MANY_REQUESTS', 'Rate limit exceeded'));
    }
}

// ---------- AUTH limiter (глобально на /auth) ----------
const authLimiter = new RateLimiterRedis({
    storeClient: redis as any,
    keyPrefix: 'rl:auth',
    points: 120,
    duration: 60, // 120 auth-req / minute / IP
});

export async function authRateLimit(
    req: Request,
    _res: Response,
    next: NextFunction,
) {
    try {
        await authLimiter.consume(keyByIp(req), 1);
        return next();
    } catch {
        return next(
            apiError(429, 'TOO_MANY_REQUESTS', 'Too many auth requests'),
        );
    }
}

// ---------- Login bruteforce limiter ----------
const loginByIp = new RateLimiterRedis({
    storeClient: redis as any,
    keyPrefix: 'rl:login:ip',
    points: 20,
    duration: 60, // 20/min per IP
});

const loginByUser = new RateLimiterRedis({
    storeClient: redis as any,
    keyPrefix: 'rl:login:user',
    points: 10,
    duration: 60, // 10/min per username
});

export async function loginRateLimit(
    req: Request,
    _res: Response,
    next: NextFunction,
) {
    try {
        await Promise.all([
            loginByIp.consume(keyByIp(req), 1),
            loginByUser.consume(usernameKey(req), 1),
        ]);
        return next();
    } catch {
        return next(
            apiError(429, 'TOO_MANY_REQUESTS', 'Too many login attempts'),
        );
    }
}
