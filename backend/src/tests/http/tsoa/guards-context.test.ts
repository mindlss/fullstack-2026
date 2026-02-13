import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../../testUtils/prismaMock';

vi.mock('../../../lib/prisma', () => ({ prisma: prismaMock }));

import {
    requireNotBanned,
    requirePermissions,
} from '../../../http/tsoa/guards';
import { requireCurrentUser } from '../../../http/tsoa/context';

describe('http/tsoa/guards + context', () => {
    beforeEach(() => vi.clearAllMocks());

    describe('requireNotBanned', () => {
        it('throws 500 if currentUser not loaded', () => {
            try {
                requireNotBanned(undefined);
                throw new Error('should not reach');
            } catch (err: any) {
                expect(err).toMatchObject({
                    name: 'ApiError',
                    status: 500,
                    code: 'INTERNAL_SERVER_ERROR',
                });
            }
        });

        it('throws 403 if banned', () => {
            try {
                requireNotBanned({ isBanned: true });
                throw new Error('should not reach');
            } catch (err: any) {
                expect(err).toMatchObject({
                    name: 'ApiError',
                    status: 403,
                    code: 'BANNED',
                });
            }
        });

        it('passes if not banned', () => {
            expect(() => requireNotBanned({ isBanned: false })).not.toThrow();
        });
    });

    describe('requirePermissions', () => {
        it('throws 401 if no principal', async () => {
            await expect(
                requirePermissions(undefined as any, ['x']),
            ).rejects.toMatchObject({
                name: 'ApiError',
                status: 401,
                code: 'UNAUTHORIZED',
            });
        });

        it('does nothing if required empty', async () => {
            await expect(
                requirePermissions({ id: 'u1' }, []),
            ).resolves.toBeUndefined();
            expect(prismaMock.permission.findMany).not.toHaveBeenCalled();
        });

        it('throws 403 with required/got when missing perms', async () => {
            prismaMock.permission.findMany.mockResolvedValue([{ key: 'a' }]);

            await expect(
                requirePermissions({ id: 'u1' }, ['a', 'b', 'b']),
            ).rejects.toMatchObject({
                name: 'ApiError',
                status: 403,
                code: 'FORBIDDEN',
                details: { required: ['a', 'b'], got: ['a'] },
            });
        });

        it('passes when all perms present', async () => {
            prismaMock.permission.findMany.mockResolvedValue([
                { key: 'a' },
                { key: 'b' },
            ]);

            await expect(
                requirePermissions({ id: 'u1' }, ['a', 'b', 'b']),
            ).resolves.toBeUndefined();
        });
    });

    describe('requireCurrentUser', () => {
        it('throws 401 if missing auth', async () => {
            const req: any = { user: undefined };
            await expect(requireCurrentUser(req)).rejects.toMatchObject({
                name: 'ApiError',
                status: 401,
                code: 'UNAUTHORIZED',
            });
        });

        it('throws 401 if user not found', async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);

            const req: any = { user: { id: 'u1' } };
            await expect(requireCurrentUser(req)).rejects.toMatchObject({
                name: 'ApiError',
                status: 401,
                code: 'UNAUTHORIZED',
            });
        });

        it('throws 401 if user deleted', async () => {
            prismaMock.user.findUnique.mockResolvedValue({
                id: 'u1',
                deletedAt: new Date(),
            });

            const req: any = { user: { id: 'u1' } };
            await expect(requireCurrentUser(req)).rejects.toMatchObject({
                name: 'ApiError',
                status: 401,
                code: 'UNAUTHORIZED',
            });
        });

        it('attaches currentUser and returns it', async () => {
            prismaMock.user.findUnique.mockResolvedValue({
                id: 'u1',
                deletedAt: null,
            });

            const req: any = { user: { id: 'u1' } };
            const u = await requireCurrentUser(req);

            expect(u).toMatchObject({ id: 'u1' });
            expect(req.currentUser).toMatchObject({ id: 'u1' });
        });
    });
});
