import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';

vi.mock('../../domain/auth/tokenBlacklist.service', () => ({
    isTokenRevoked: vi.fn().mockResolvedValue(false),
}));

import {
    signAccessToken,
    verifyAccessToken,
    signRefreshToken,
    verifyRefreshToken,
} from '../../domain/auth/token.service';

describe('token.service', () => {
    it('sign/verify access token roundtrip', async () => {
        const token = signAccessToken({ sub: 'u1' });
        const payload = await verifyAccessToken(token);
        expect(payload.sub).toBe('u1');
        expect(payload.jti).toBeTruthy();
        expect(payload.exp).toBeTypeOf('number');
    });

    it('sign/verify refresh token roundtrip', async () => {
        const token = signRefreshToken({ sub: 'u2' });
        const payload = await verifyRefreshToken(token);
        expect(payload.sub).toBe('u2');
        expect(payload.jti).toBeTruthy();
        expect(payload.exp).toBeTypeOf('number');
    });

    it('verifyAccessToken throws on invalid token', async () => {
        await expect(verifyAccessToken('nope')).rejects.toThrow(
            jwt.JsonWebTokenError,
        );
    });

    it('verifyRefreshToken throws on invalid token', async () => {
        await expect(verifyRefreshToken('nope')).rejects.toThrow(
            jwt.JsonWebTokenError,
        );
    });
});
