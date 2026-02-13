import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ApiError } from '../../http/errors/ApiError';
import { prismaMock } from '../testUtils/prismaMock';

vi.mock('../../lib/prisma', () => ({ prisma: prismaMock }));

vi.mock('../../domain/auth/password.service', () => ({
    hashPassword: vi.fn(async () => 'HASHED'),
    verifyPassword: vi.fn(async () => true),
}));

vi.mock('../../domain/auth/token.service', () => ({
    signAccessToken: vi.fn(() => 'ACCESS'),
    signRefreshToken: vi.fn(() => 'REFRESH'),
}));

import { registerUser, loginUser } from '../../domain/auth/auth.service';
import {
    hashPassword,
    verifyPassword,
} from '../../domain/auth/password.service';
import {
    signAccessToken,
    signRefreshToken,
} from '../../domain/auth/token.service';

describe('domain/auth/auth.service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('registerUser', () => {
        it('creates user with hashed password, assigns default role if exists, returns tokens', async () => {
            (prismaMock.user.create as any).mockResolvedValue({
                id: 'u1',
                username: 'bob',
                password: 'HASHED',
            });
            (prismaMock.role.findUnique as any).mockResolvedValue({
                id: 'r-user',
                key: 'user',
            });

            const out = await registerUser({
                username: 'bob',
                password: 'secret',
            });

            expect(hashPassword).toHaveBeenCalledWith('secret');
            expect(prismaMock.user.create).toHaveBeenCalledWith({
                data: { username: 'bob', password: 'HASHED' },
            });

            expect(prismaMock.role.findUnique).toHaveBeenCalledWith({
                where: { key: 'user' },
            });
            expect(prismaMock.roleAssignment.upsert).toHaveBeenCalledWith({
                where: { userId_roleId: { userId: 'u1', roleId: 'r-user' } },
                update: {},
                create: { userId: 'u1', roleId: 'r-user' },
            });

            expect(signAccessToken).toHaveBeenCalledWith({ sub: 'u1' });
            expect(signRefreshToken).toHaveBeenCalledWith({ sub: 'u1' });

            expect(out).toEqual({
                user: { id: 'u1', username: 'bob', password: 'HASHED' },
                token: 'ACCESS',
                refreshToken: 'REFRESH',
            });
        });

        it('skips default role assignment if role "user" does not exist', async () => {
            (prismaMock.user.create as any).mockResolvedValue({
                id: 'u1',
                username: 'bob',
                password: 'HASHED',
            });
            (prismaMock.role.findUnique as any).mockResolvedValue(null);

            await registerUser({ username: 'bob', password: 'secret' });

            expect(prismaMock.roleAssignment.upsert).not.toHaveBeenCalled();
        });
    });

    describe('loginUser', () => {
        it('throws 401 INVALID_CREDENTIALS if user not found', async () => {
            (prismaMock.user.findUnique as any).mockResolvedValue(null);

            await expect(
                loginUser({ username: 'bob', password: 'x' }),
            ).rejects.toMatchObject({
                name: 'ApiError',
                status: 401,
                code: 'INVALID_CREDENTIALS',
            } satisfies Partial<ApiError>);
        });

        it('throws 401 INVALID_CREDENTIALS if deleted', async () => {
            (prismaMock.user.findUnique as any).mockResolvedValue({
                id: 'u1',
                username: 'bob',
                password: 'HASH',
                deletedAt: new Date(),
                isBanned: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            await expect(
                loginUser({ username: 'bob', password: 'x' }),
            ).rejects.toMatchObject({
                name: 'ApiError',
                status: 401,
                code: 'INVALID_CREDENTIALS',
            });
        });

        it('throws 403 BANNED if banned', async () => {
            (prismaMock.user.findUnique as any).mockResolvedValue({
                id: 'u1',
                username: 'bob',
                password: 'HASH',
                deletedAt: null,
                isBanned: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            await expect(
                loginUser({ username: 'bob', password: 'x' }),
            ).rejects.toMatchObject({
                name: 'ApiError',
                status: 403,
                code: 'BANNED',
            });
        });

        it('throws 401 INVALID_CREDENTIALS if password mismatch', async () => {
            (prismaMock.user.findUnique as any).mockResolvedValue({
                id: 'u1',
                username: 'bob',
                password: 'HASH',
                deletedAt: null,
                isBanned: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            (verifyPassword as any).mockResolvedValue(false);

            await expect(
                loginUser({ username: 'bob', password: 'wrong' }),
            ).rejects.toMatchObject({
                name: 'ApiError',
                status: 401,
                code: 'INVALID_CREDENTIALS',
            });
        });

        it('returns tokens on success', async () => {
            (prismaMock.user.findUnique as any).mockResolvedValue({
                id: 'u1',
                username: 'bob',
                password: 'HASH',
                deletedAt: null,
                isBanned: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            (verifyPassword as any).mockResolvedValue(true);

            const out = await loginUser({ username: 'bob', password: 'ok' });

            expect(verifyPassword).toHaveBeenCalledWith('HASH', 'ok');
            expect(out.token).toBe('ACCESS');
            expect(out.refreshToken).toBe('REFRESH');
            expect(signAccessToken).toHaveBeenCalledWith({ sub: 'u1' });
            expect(signRefreshToken).toHaveBeenCalledWith({ sub: 'u1' });
        });
    });
});
