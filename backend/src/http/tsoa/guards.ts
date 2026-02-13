import { prisma } from '../../lib/prisma';
import { apiError } from '../errors/ApiError';

/**
 * Throws 403 if user is banned.
 */
export function requireNotBanned(
    currentUser: { isBanned: boolean } | undefined,
) {
    if (!currentUser) {
        throw apiError(500, 'INTERNAL_SERVER_ERROR', 'currentUser not loaded');
    }
    if (currentUser.isBanned) {
        throw apiError(403, 'BANNED', 'User is banned');
    }
}

/**
 * Throws 403 if user is missing required permissions.
 */
export async function requirePermissions(
    principal: { id: string } | undefined,
    required: string[],
) {
    if (!principal) {
        throw apiError(401, 'UNAUTHORIZED', 'Missing auth');
    }
    if (!required.length) return;

    const uniqRequired = Array.from(new Set(required));

    const rows = await prisma.permission.findMany({
        where: {
            key: { in: uniqRequired },
            roles: {
                some: {
                    role: {
                        assignments: {
                            some: { userId: principal.id },
                        },
                    },
                },
            },
        },
        select: { key: true },
    });

    if (rows.length !== uniqRequired.length) {
        throw apiError(403, 'FORBIDDEN', 'Missing permissions', {
            required: uniqRequired,
            got: rows.map((r) => r.key),
        });
    }
}
