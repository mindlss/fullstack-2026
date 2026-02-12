import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../../testUtils/prismaMock';

vi.mock('../../../lib/prisma', () => ({ prisma: prismaMock }));

vi.mock('../../../domain/auth/token.service', () => ({
    verifyAccessToken: vi.fn(() => ({ sub: 'u1' })),
}));

import { expressAuthentication } from '../../../http/tsoa/authentication';
import { Scope } from '../../../domain/auth/permissions';
import { verifyAccessToken } from '../../../domain/auth/token.service';

describe('http/tsoa/expressAuthentication', () => {
    beforeEach(() => vi.clearAllMocks());

    it('optionalCookieAuth: returns undefined if no token', async () => {
        const req: any = { cookies: {}, headers: {} };
        const out = await expressAuthentication(req, 'optionalCookieAuth', []);
        expect(out).toBeUndefined();
    });

    it('cookieAuth: throws 401 if no token', async () => {
        const req: any = { cookies: {}, headers: {} };
        await expect(
            expressAuthentication(req, 'cookieAuth', []),
        ).rejects.toMatchObject({
            name: 'ApiError',
            status: 401,
            code: 'UNAUTHORIZED',
        });
    });

    it('optionalCookieAuth: invalid token -> undefined (swallow)', async () => {
        (verifyAccessToken as any).mockImplementationOnce(() => {
            throw new Error('bad');
        });

        const req: any = { cookies: { accessToken: 't' }, headers: {} };
        const out = await expressAuthentication(req, 'optionalCookieAuth', []);
        expect(out).toBeUndefined();
    });

    it('cookieAuth: deleted user -> 401', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
            id: 'u1',
            deletedAt: new Date(),
        });

        const req: any = { cookies: { accessToken: 't' }, headers: {} };
        await expect(
            expressAuthentication(req, 'cookieAuth', []),
        ).rejects.toMatchObject({
            name: 'ApiError',
            status: 401,
            code: 'UNAUTHORIZED',
        });
    });

    it('cookieAuth: returns principal {id} when ok and no perms required', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
            id: 'u1',
            deletedAt: null,
        });

        const req: any = { cookies: { accessToken: 't' }, headers: {} };
        const out = await expressAuthentication(req, 'cookieAuth', []);

        expect(out).toEqual({ id: 'u1' });
        expect(prismaMock.permission.findMany).not.toHaveBeenCalled();
    });

    it('cookieAuth: Scope.LOAD_PERMISSIONS forces permission load', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
            id: 'u1',
            deletedAt: null,
        });
        prismaMock.permission.findMany.mockResolvedValue([
            { key: 'p1' },
            { key: 'p1' },
        ]);

        const req: any = { cookies: { accessToken: 't' }, headers: {} };
        const out = await expressAuthentication(req, 'cookieAuth', [
            Scope.LOAD_PERMISSIONS,
        ]);

        expect(out).toEqual({ id: 'u1', permissions: ['p1'] });
    });

    it('cookieAuth: missing required permission -> 403 FORBIDDEN with required', async () => {
        prismaMock.user.findUnique.mockResolvedValue({
            id: 'u1',
            deletedAt: null,
        });
        prismaMock.permission.findMany.mockResolvedValue([{ key: 'have' }]);

        const req: any = { cookies: { accessToken: 't' }, headers: {} };
        await expect(
            expressAuthentication(req, 'cookieAuth', ['need']),
        ).rejects.toMatchObject({
            name: 'ApiError',
            status: 403,
            code: 'FORBIDDEN',
            details: { required: ['need'] },
        });
    });

    it('optionalCookieAuth: returns undefined if user missing/deleted', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);

        const req: any = { cookies: { accessToken: 't' }, headers: {} };
        const out = await expressAuthentication(req, 'optionalCookieAuth', []);
        expect(out).toBeUndefined();
    });
});
