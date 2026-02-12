import type { Request } from 'express';
import { prisma } from '../../lib/prisma';
import { apiError } from '../errors/ApiError';

export async function requireCurrentUser(req: Request) {
    if (!req.user?.id) throw apiError(401, 'UNAUTHORIZED', 'Missing auth');

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || user.deletedAt)
        throw apiError(401, 'UNAUTHORIZED', 'User not found');

    req.currentUser = user;
    return user;
}
