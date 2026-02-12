import { prisma } from '../../lib/prisma';
import { Permission } from '../auth/permissions';
import type { Principal } from '../auth/principal';
import { getPrincipalPermissions } from '../auth/principal';

async function canReadDeletedUsers(principal: Principal): Promise<boolean> {
    if (!principal?.id) return false;

    const perms = await getPrincipalPermissions(principal);
    return perms.includes(Permission.USERS_READ_DELETED);
}

export async function getUserPublicById(params: {
    userId: string;
    principal: Principal;
}) {
    const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: {
            id: true,
            username: true,
            createdAt: true,
            deletedAt: true,
        },
    });

    if (!user) return null;

    if (user.deletedAt) {
        const allowed = await canReadDeletedUsers(params.principal);
        if (!allowed) return null;
    }

    return { ...user };
}

export async function getUserSelf(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            createdAt: true,
            updatedAt: true,
            isBanned: true,
            deletedAt: true,
        },
    });

    if (!user || user.deletedAt) return null;
    return { ...user };
}

export async function getUserRoleKeys(userId: string): Promise<string[]> {
    const rows = await prisma.roleAssignment.findMany({
        where: { userId },
        select: { role: { select: { key: true, name: true } } },
    });

    return rows.map((r) => r.role.key);
}
