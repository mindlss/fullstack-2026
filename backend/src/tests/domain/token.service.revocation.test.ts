import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

const h = vi.hoisted(() => {
    return {
        isTokenRevoked: vi.fn(),
    };
});

vi.mock('../../domain/auth/tokenBlacklist.service', () => ({
    isTokenRevoked: h.isTokenRevoked,
}));

vi.mock('../../config/env', () => ({
    env: {
        JWT_SECRET: 's1',
        JWT_REFRESH_SECRET: 's2',
        JWT_EXPIRES_IN: 60,
        JWT_REFRESH_EXPIRES_IN: 3600,
    },
}));

import {
    verifyAccessToken,
    verifyRefreshToken,
} from '../../domain/auth/token.service';

describe('token.service (revocation/branches)', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    it('verifyAccessToken throws if payload has no jti/exp', async () => {
        vi.spyOn(jwt, 'verify').mockReturnValue({ sub: 'u1' } as any);
        h.isTokenRevoked.mockResolvedValue(false);

        await expect(verifyAccessToken('t')).rejects.toThrow(
            jwt.JsonWebTokenError,
        );
        expect(h.isTokenRevoked).not.toHaveBeenCalled();
    });

    it('verifyAccessToken throws if token is revoked', async () => {
        vi.spyOn(jwt, 'verify').mockReturnValue({
            sub: 'u1',
            jti: 'j1',
            exp: 2_000_000_000,
            iat: 1_900_000_000,
        } as any);

        h.isTokenRevoked.mockResolvedValue(true);

        await expect(verifyAccessToken('t')).rejects.toThrow(
            jwt.JsonWebTokenError,
        );
        expect(h.isTokenRevoked).toHaveBeenCalledWith({
            kind: 'access',
            jti: 'j1',
        });
    });

    it('verifyAccessToken returns decoded payload when not revoked', async () => {
        vi.spyOn(jwt, 'verify').mockReturnValue({
            sub: 'u1',
            jti: 'j1',
            exp: 2_000_000_000,
            iat: 1_900_000_000,
        } as any);

        h.isTokenRevoked.mockResolvedValue(false);

        const p = await verifyAccessToken('t');
        expect(p.sub).toBe('u1');
        expect(p.jti).toBe('j1');
        expect(h.isTokenRevoked).toHaveBeenCalledWith({
            kind: 'access',
            jti: 'j1',
        });
    });

    it('verifyRefreshToken throws if token is revoked', async () => {
        vi.spyOn(jwt, 'verify').mockReturnValue({
            sub: 'u2',
            jti: 'jr1',
            exp: 2_000_000_000,
            iat: 1_900_000_000,
        } as any);

        h.isTokenRevoked.mockResolvedValue(true);

        await expect(verifyRefreshToken('t')).rejects.toThrow(
            jwt.JsonWebTokenError,
        );
        expect(h.isTokenRevoked).toHaveBeenCalledWith({
            kind: 'refresh',
            jti: 'jr1',
        });
    });
});
