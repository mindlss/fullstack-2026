import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../testUtils/prismaMock';

vi.mock('../../lib/prisma', () => ({ prisma: prismaMock }));

import {
    getPrincipalPermissions,
    type Principal,
} from '../../domain/auth/principal';

describe('domain/auth/principal.getPrincipalPermissions', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns [] for undefined principal', async () => {
        await expect(getPrincipalPermissions(undefined)).resolves.toEqual([]);
        expect(prismaMock.permission.findMany).not.toHaveBeenCalled();
    });

    it('returns [] for principal without id', async () => {
        await expect(getPrincipalPermissions({} as any)).resolves.toEqual([]);
        expect(prismaMock.permission.findMany).not.toHaveBeenCalled();
    });

    it('returns cached permissions if present', async () => {
        const p: Principal = { id: 'u1', permissions: ['a', 'b'] };
        await expect(getPrincipalPermissions(p)).resolves.toEqual(['a', 'b']);
        expect(prismaMock.permission.findMany).not.toHaveBeenCalled();
    });

    it('loads permissions from DB and de-dupes', async () => {
        prismaMock.permission.findMany.mockResolvedValue([
            { key: 'x' },
            { key: 'x' },
            { key: 'y' },
        ]);

        const p: Principal = { id: 'u1' };
        const perms = await getPrincipalPermissions(p);

        expect(prismaMock.permission.findMany).toHaveBeenCalledOnce();
        expect(perms.sort()).toEqual(['x', 'y']);
    });
});
