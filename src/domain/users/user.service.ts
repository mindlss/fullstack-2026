import { prisma } from '../../lib/prisma';
import { UserRole } from '@prisma/client';

type Viewer = { id?: string; role: UserRole } | undefined;

function isModerator(viewer: Viewer) {
    return (
        viewer?.role === UserRole.MODERATOR || viewer?.role === UserRole.ADMIN
    );
}

export async function getUserPublicById(params: {
    userId: string;
    viewer: Viewer;
}) {
    const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: {
            id: true,
            username: true,
            role: true,
            createdAt: true,
            deletedAt: true,
        },
    });

    if (!user) return null;

    if (user.deletedAt && !isModerator(params.viewer)) return null;

    return { ...user };
}

export async function getUserSelf(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            isBanned: true,
            deletedAt: true,
        },
    });

    if (!user || user.deletedAt) return null;

    return { ...user };
}
