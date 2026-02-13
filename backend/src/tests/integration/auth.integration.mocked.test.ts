import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { prismaMock } from '../testUtils/prismaMock';

vi.mock('../../lib/prisma', () => ({ prisma: prismaMock }));

vi.mock('../../domain/auth/password.service', () => ({
    hashPassword: vi.fn(async () => 'HASHED'),
    verifyPassword: vi.fn(async () => true),
}));

vi.mock('../../domain/auth/token.service', () => ({
    signAccessToken: vi.fn(() => 'ACCESS'),
    signRefreshToken: vi.fn(() => 'REFRESH'),
    verifyAccessToken: vi.fn(() => ({ sub: 'u1' })),
    verifyRefreshToken: vi.fn(() => ({ sub: 'u1' })),
}));

vi.mock('../../domain/users/user.service', () => ({
    getUserSelf: vi.fn(async () => ({
        id: 'u1',
        username: 'bob',
        createdAt: new Date(),
        updatedAt: new Date(),
        isBanned: false,
        deletedAt: null,
    })),
    getUserRoleKeys: vi.fn(async () => ['user']),
    getUserPublicById: vi.fn(async () => ({
        id: 'u2',
        username: 'someone',
        createdAt: new Date(),
    })),
}));

import { createApp } from '../../app';

describe('auth endpoints (integration, mocked prisma)', () => {
    const app = createApp();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('POST /auth/register -> 201 + AuthResponseDTO + sets cookies', async () => {
        (prismaMock.user.create as any).mockResolvedValue({
            id: 'u1',
            username: 'bob',
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            isBanned: false,
        });
        (prismaMock.role.findUnique as any).mockResolvedValue({
            id: 'r-user',
            key: 'user',
        });

        const res = await request(app)
            .post('/auth/register')
            .send({ username: 'bob', password: 'secret123' })
            .expect(201);

        expect(res.body.user).toBeTruthy();
        expect(res.body.user.id).toBe('u1');
        expect(Array.isArray(res.body.user.roles)).toBe(true);
        expect(Array.isArray(res.body.user.permissions)).toBe(true);

        const setCookie = (
            Array.isArray(res.headers['set-cookie'])
                ? res.headers['set-cookie']
                : res.headers['set-cookie']
                  ? [String(res.headers['set-cookie'])]
                  : []
        ) as string[];
        expect(setCookie?.some((c) => c.startsWith('accessToken='))).toBe(true);
        expect(setCookie?.some((c) => c.startsWith('refreshToken='))).toBe(
            true,
        );
    });

    it('POST /auth/login -> 401 INVALID_CREDENTIALS when user not found', async () => {
        (prismaMock.user.findUnique as any).mockResolvedValue(null);

        const res = await request(app)
            .post('/auth/login')
            .send({ username: 'bob', password: 'password123' })
            .expect(401);

        expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('POST /auth/login -> 200 + sets cookies on success', async () => {
        (prismaMock.user.findUnique as any).mockResolvedValue({
            id: 'u1',
            username: 'bob',
            password: 'HASHED',
            deletedAt: null,
            isBanned: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const res = await request(app)
            .post('/auth/login')
            .send({ username: 'bob', password: 'password123' })
            .expect(200);

        expect(res.body.user.id).toBe('u1');

        const setCookie = (
            Array.isArray(res.headers['set-cookie'])
                ? res.headers['set-cookie']
                : res.headers['set-cookie']
                  ? [String(res.headers['set-cookie'])]
                  : []
        ) as string[];
        expect(setCookie?.some((c) => c.startsWith('accessToken='))).toBe(true);
        expect(setCookie?.some((c) => c.startsWith('refreshToken='))).toBe(
            true,
        );
    });

    it('POST /auth/login -> 400 VALIDATION_ERROR for bad body (tsoa/zod)', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ username: 123, password: null })
            .expect(400);

        expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
});
