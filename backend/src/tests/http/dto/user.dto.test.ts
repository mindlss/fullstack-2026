import { describe, expect, it } from 'vitest';
import { toUserPublicDTO, toUserSelfDTO } from '../../../http/dto/user.dto';

describe('http/dto/user.dto', () => {
    it('toUserPublicDTO: maps and ISO dates', () => {
        const dto = toUserPublicDTO({
            id: 'u1',
            username: 'bob',
            createdAt: '2026-02-12T12:00:00.000Z',
        });

        expect(dto).toEqual({
            id: 'u1',
            username: 'bob',
            createdAt: new Date('2026-02-12T12:00:00.000Z').toISOString(),
        });
    });

    it('toUserSelfDTO: booleans + roles/permissions arrays fallback', () => {
        const dto = toUserSelfDTO({
            id: 'u1',
            username: 'bob',
            createdAt: 0,
            updatedAt: 1,
            isBanned: 'truthy',
            roles: 'admin',
            permissions: null,
        });

        expect(dto.id).toBe('u1');
        expect(dto.username).toBe('bob');
        expect(dto.createdAt).toBe(new Date(0).toISOString());
        expect(dto.updatedAt).toBe(new Date(1).toISOString());
        expect(dto.isBanned).toBe(true);

        expect(dto.roles).toEqual([]);
        expect(dto.permissions).toEqual([]);
    });

    it('toUserSelfDTO: keeps arrays as-is', () => {
        const dto = toUserSelfDTO({
            id: 'u1',
            username: 'bob',
            createdAt: '2026-02-12T00:00:00.000Z',
            updatedAt: '2026-02-12T01:00:00.000Z',
            isBanned: false,
            roles: ['user'],
            permissions: ['users.read'],
        });

        expect(dto.roles).toEqual(['user']);
        expect(dto.permissions).toEqual(['users.read']);
        expect(dto.isBanned).toBe(false);
    });
});
