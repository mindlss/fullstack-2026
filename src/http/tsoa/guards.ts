import { prisma } from '../../lib/prisma';
import { apiError } from '../errors/ApiError';
import type { UserRole } from '@prisma/client';

/**
 * Throws 403 if user is banned.
 */
export function requireNotBanned(
    currentUser: { isBanned: boolean } | undefined
) {
    if (!currentUser) {
        throw apiError(500, 'INTERNAL_SERVER_ERROR', 'currentUser not loaded');
    }
    if (currentUser.isBanned) {
        throw apiError(403, 'BANNED', 'User is banned');
    }
}

/**
 * Throws 403 if role is not in allowed list.
 */
export function requireRole(role: UserRole | undefined, allowed: UserRole[]) {
    if (!role) {
        throw apiError(401, 'UNAUTHORIZED', 'Missing auth');
    }
    if (!allowed.includes(role)) {
        throw apiError(403, 'FORBIDDEN', 'Insufficient role', {
            required: allowed,
            got: role,
        });
    }
}
