import { prisma } from '../../lib/prisma';
import { hashPassword, verifyPassword } from './password.service';
import { signAccessToken, signRefreshToken } from './token.service';
import { apiError } from '../../http/errors/ApiError';

async function assignDefaultRole(userId: string) {
    const role = await prisma.role.findUnique({ where: { key: 'user' } });
    if (!role) return;

    await prisma.roleAssignment.upsert({
        where: { userId_roleId: { userId, roleId: role.id } },
        update: {},
        create: { userId, roleId: role.id },
    });
}

export async function registerUser(input: {
    username: string;
    password: string;
}) {
    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
        data: {
            username: input.username,
            password: passwordHash,
        },
    });

    await assignDefaultRole(user.id);

    const token = signAccessToken({ sub: user.id });
    const refreshToken = signRefreshToken({ sub: user.id });

    return { user, token, refreshToken };
}

export async function loginUser(input: { username: string; password: string }) {
    const user = await prisma.user.findUnique({
        where: { username: input.username },
        select: {
            id: true,
            username: true,
            password: true,
            deletedAt: true,
            isBanned: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user || user.deletedAt) {
        throw apiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }
    if (user.isBanned) {
        throw apiError(403, 'BANNED', 'User is banned');
    }

    const ok = await verifyPassword(user.password, input.password);
    if (!ok) {
        throw apiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const token = signAccessToken({ sub: user.id });
    const refreshToken = signRefreshToken({ sub: user.id });

    return { user, token, refreshToken };
}
