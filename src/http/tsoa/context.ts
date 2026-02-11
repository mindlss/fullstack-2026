import type { Request } from 'express';
import { prisma } from '../../lib/prisma';
import { UserRole } from '@prisma/client';
import { apiError } from '../errors/ApiError';

/**
 * Ensures req.viewer is always present.
 * - Default: guest
 * - If req.user?.id is set (from tsoa authentication), tries to load minimal user fields
 * - On any error or missing/deleted user => guest
 */
export async function ensureViewer(req: Request): Promise<void> {
    req.viewer = { role: UserRole.GUEST };

    if (!req.user?.id) return;

    try {
        const u = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                role: true,
                deletedAt: true,
            },
        });

        if (!u || u.deletedAt) {
            req.user = undefined;
            req.viewer = { role: UserRole.GUEST };
            return;
        }

        req.viewer = {
            id: u.id,
            role: u.role,
        };
    } catch {
        req.viewer = { role: UserRole.GUEST };
    }
}

/**
 * Loads full current user and also sets req.viewer.
 * Throws ApiError(401) if auth missing or user not found/deleted.
 *
 * This replaces currentUserMiddleware but without Express res/next usage.
 */
export async function requireCurrentUser(req: Request) {
    if (!req.user?.id) {
        throw apiError(401, 'UNAUTHORIZED', 'Missing auth');
    }

    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
    });

    if (!user || user.deletedAt) {
        throw apiError(401, 'UNAUTHORIZED', 'User not found');
    }

    req.currentUser = user;

    req.viewer = {
        id: user.id,
        role: user.role,
    };

    return { user, viewer: req.viewer };
}
