import type { Request } from 'express';
import { verifyAccessToken } from '../../domain/auth/token.service';
import { apiError } from '../errors/ApiError';
import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';

function readAccessTokenFromCookie(req: Request): string | null {
    const token = (req as any).cookies?.accessToken;
    if (typeof token !== 'string') return null;
    const t = token.trim();
    return t ? t : null;
}

function readBearerFallback(req: Request): string | null {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return null;
    const token = header.slice('Bearer '.length).trim();
    return token || null;
}

async function userHasAllPermissions(userId: string, permissionKeys: string[]) {
    if (!permissionKeys.length) return true;

    const rows = await prisma.permission.findMany({
        where: {
            key: { in: permissionKeys },
            roles: {
                some: {
                    role: {
                        assignments: {
                            some: { userId },
                        },
                    },
                },
            },
        },
        select: { key: true },
    });

    return rows.length === new Set(permissionKeys).size;
}

/**
 * tsoa hook: called from generated routes when you use @Security(...)
 *
 * - @Security("cookieAuth")           -> requires accessToken cookie (401 if missing/invalid)
 * - @Security("optionalCookieAuth")   -> parses cookie if present, ignores if missing/invalid
 *
 */
export async function expressAuthentication(
    req: Request,
    securityName: string,
    scopes?: string[],
): Promise<any> {
    const token =
        readAccessTokenFromCookie(req) ??
        (env.NODE_ENV !== 'production' ? readBearerFallback(req) : null);

    if (securityName === 'optionalCookieAuth') {
        if (!token) return undefined;

        try {
            const payload = verifyAccessToken(token);
            const principal = { id: payload.sub };

            if (scopes?.length) {
                const ok = await userHasAllPermissions(principal.id, scopes);
                if (!ok) {
                    throw apiError(403, 'FORBIDDEN', 'Missing permissions', {
                        required: scopes,
                    });
                }
            }

            return principal;
        } catch {
            return undefined;
        }
    }

    if (securityName === 'cookieAuth') {
        if (!token) {
            throw apiError(401, 'UNAUTHORIZED', 'Missing access token');
        }

        const payload = verifyAccessToken(token);
        const principal = { id: payload.sub };

        if (scopes?.length) {
            const ok = await userHasAllPermissions(principal.id, scopes);
            if (!ok) {
                throw apiError(403, 'FORBIDDEN', 'Missing permissions', {
                    required: scopes,
                });
            }
        }

        return principal;
    }

    throw apiError(401, 'UNAUTHORIZED', 'Unknown security scheme');
}
