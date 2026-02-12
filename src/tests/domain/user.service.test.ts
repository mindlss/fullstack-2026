import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../testUtils/prismaMock';
import { Permission } from '../../domain/auth/permissions';

vi.mock('../../lib/prisma', () => ({ prisma: prismaMock }));

import {
    getUserPublicById,
    getUserSelf,
    getUserRoleKeys,
} from '../../domain/users/user.service';

describe('domain/users/user.service', () => {
    beforeEach(() => vi.clearAllMocks());

    describe('getUserPublicById', () => {
        it('returns null if user not found', async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);

            const out = await getUserPublicById({
                userId: 'u1',
                principal: undefined,
            });
            expect(out).toBeNull();
        });

        it('returns user if not deleted (no permission lookup)', async () => {
            prismaMock.user.findUnique.mockResolvedValue({
                id: 'u1',
                username: 'bob',
                createdAt: new Date(),
                deletedAt: null,
            });

            const out = await getUserPublicById({
                userId: 'u1',
                principal: undefined,
            });
            expect(out).toMatchObject({ id: 'u1', username: 'bob' });
            expect(prismaMock.permission.findMany).not.toHaveBeenCalled();
        });

        it('hides deleted user if principal lacks USERS_READ_DELETED', async () => {
            prismaMock.user.findUnique.mockResolvedValue({
                id: 'u1',
                username: 'bob',
                createdAt: new Date(),
                deletedAt: new Date(),
            });

            prismaMock.permission.findMany.mockResolvedValue([
                { key: Permission.USERS_READ },
            ]);

            const out = await getUserPublicById({
                userId: 'u1',
                principal: { id: 'viewer' },
            });

            expect(prismaMock.permission.findMany).toHaveBeenCalledOnce();
            expect(out).toBeNull();
        });

        it('returns deleted user if principal has USERS_READ_DELETED', async () => {
            prismaMock.user.findUnique.mockResolvedValue({
                id: 'u1',
                username: 'bob',
                createdAt: new Date(),
                deletedAt: new Date(),
            });

            prismaMock.permission.findMany.mockResolvedValue([
                { key: Permission.USERS_READ_DELETED },
            ]);

            const out = await getUserPublicById({
                userId: 'u1',
                principal: { id: 'viewer' },
            });

            expect(out).not.toBeNull();
            expect(out!.id).toBe('u1');
        });
    });

    describe('getUserSelf', () => {
        it('returns null if not found', async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);
            await expect(getUserSelf('u1')).resolves.toBeNull();
        });

        it('returns null if deleted', async () => {
            prismaMock.user.findUnique.mockResolvedValue({
                id: 'u1',
                username: 'bob',
                createdAt: new Date(),
                updatedAt: new Date(),
                isBanned: false,
                deletedAt: new Date(),
            });

            await expect(getUserSelf('u1')).resolves.toBeNull();
        });

        it('returns user if active', async () => {
            prismaMock.user.findUnique.mockResolvedValue({
                id: 'u1',
                username: 'bob',
                createdAt: new Date(),
                updatedAt: new Date(),
                isBanned: false,
                deletedAt: null,
            });

            const out = await getUserSelf('u1');
            expect(out).toMatchObject({ id: 'u1', username: 'bob' });
        });
    });

    describe('getUserRoleKeys', () => {
        it('maps role keys', async () => {
            prismaMock.roleAssignment.findMany.mockResolvedValue([
                { role: { key: 'admin', name: 'Admin' } },
                { role: { key: 'user', name: 'User' } },
            ]);

            const out = await getUserRoleKeys('u1');
            expect(out).toEqual(['admin', 'user']);
        });
    });
});
