import { describe, it, expect, vi, beforeEach } from 'vitest';

import { UsersController } from '../../../http/controllers/user.controller';

vi.mock('../../../domain/users/user.service', () => ({
    getUserSelf: vi.fn(),
    getUserRoleKeys: vi.fn(),
    getUserPublicById: vi.fn(),
}));

import {
    getUserSelf,
    getUserRoleKeys,
    getUserPublicById,
} from '../../../domain/users/user.service';

type MockReq = {
    user?: { id: string; permissions?: string[] };
};

function mkReq(user?: MockReq['user']): MockReq {
    return { user };
}

describe('UsersController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /users/me (getMe)', () => {
        it('returns UserSelfDTO with roles + permissions (happy path)', async () => {
            const c = new UsersController();

            vi.mocked(getUserSelf).mockResolvedValue({
                id: 'u1',
                username: 'bob',
                createdAt: new Date('2020-01-01T00:00:00.000Z'),
                updatedAt: new Date('2020-01-02T00:00:00.000Z'),
                isBanned: false,
                deletedAt: null,
            } as any);

            vi.mocked(getUserRoleKeys).mockResolvedValue(['user', 'admin']);

            const req = mkReq({ id: 'u1', permissions: ['USERS_READ'] });

            const dto = await c.getMe(req as any);

            expect(dto).toEqual({
                id: 'u1',
                username: 'bob',
                createdAt: '2020-01-01T00:00:00.000Z',
                updatedAt: '2020-01-02T00:00:00.000Z',
                isBanned: false,
                roles: ['user', 'admin'],
                permissions: ['USERS_READ'],
            });

            expect(getUserSelf).toHaveBeenCalledWith('u1');
            expect(getUserRoleKeys).toHaveBeenCalledWith('u1');
        });

        it('defaults permissions to [] if not present on req.user', async () => {
            const c = new UsersController();

            vi.mocked(getUserSelf).mockResolvedValue({
                id: 'u1',
                username: 'bob',
                createdAt: new Date('2020-01-01T00:00:00.000Z'),
                updatedAt: new Date('2020-01-02T00:00:00.000Z'),
                isBanned: false,
                deletedAt: null,
            } as any);

            vi.mocked(getUserRoleKeys).mockResolvedValue(['user']);

            const req = mkReq({ id: 'u1' }); // permissions отсутствуют

            const dto = await c.getMe(req as any);

            expect(dto.permissions).toEqual([]);
            expect(dto.roles).toEqual(['user']);
        });

        it('throws 401 UNAUTHORIZED if user not found in service', async () => {
            const c = new UsersController();

            vi.mocked(getUserSelf).mockResolvedValue(null as any);

            const req = mkReq({ id: 'u1', permissions: [] });

            try {
                await c.getMe(req as any);
                throw new Error('expected to throw');
            } catch (e: any) {
                expect(e?.name).toBe('ApiError');
                expect(e?.status).toBe(401);
                expect(e?.code).toBe('UNAUTHORIZED');
            }

            expect(getUserSelf).toHaveBeenCalledWith('u1');
            expect(getUserRoleKeys).not.toHaveBeenCalled();
        });
    });

    describe('GET /users/:id (getUserPublic)', () => {
        it('returns UserPublicDTO (happy path)', async () => {
            const c = new UsersController();

            vi.mocked(getUserPublicById).mockResolvedValue({
                id: 'u2',
                username: 'alice',
                createdAt: new Date('2021-05-10T12:00:00.000Z'),
                deletedAt: null,
            } as any);

            const req = mkReq(undefined); // optional auth

            const dto = await c.getUserPublic(
                '0f7b1e2a-1111-2222-3333-444455556666',
                req as any,
            );

            expect(dto).toEqual({
                id: 'u2',
                username: 'alice',
                createdAt: '2021-05-10T12:00:00.000Z',
            });

            expect(getUserPublicById).toHaveBeenCalledWith({
                userId: '0f7b1e2a-1111-2222-3333-444455556666',
                principal: undefined,
            });
        });

        it('throws 404 NOT_FOUND if service returns null', async () => {
            const c = new UsersController();

            vi.mocked(getUserPublicById).mockResolvedValue(null as any);

            const req = mkReq({ id: 'viewer', permissions: [] });

            try {
                await c.getUserPublic(
                    '0f7b1e2a-1111-2222-3333-444455556666',
                    req as any,
                );
                throw new Error('expected to throw');
            } catch (e: any) {
                expect(e?.name).toBe('ApiError');
                expect(e?.status).toBe(404);
                expect(e?.code).toBe('NOT_FOUND');
            }
        });
    });
});
