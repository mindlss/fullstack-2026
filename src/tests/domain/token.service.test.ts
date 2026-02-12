import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import {
    signAccessToken,
    verifyAccessToken,
    signRefreshToken,
    verifyRefreshToken,
} from '../../domain/auth/token.service';

describe('token.service', () => {
    it('sign/verify access token roundtrip', () => {
        const token = signAccessToken({ sub: 'u1' });
        const payload = verifyAccessToken(token);
        expect(payload.sub).toBe('u1');
    });

    it('sign/verify refresh token roundtrip', () => {
        const token = signRefreshToken({ sub: 'u2' });
        const payload = verifyRefreshToken(token);
        expect(payload.sub).toBe('u2');
    });

    it('verifyAccessToken throws on invalid token', () => {
        expect(() => verifyAccessToken('nope')).toThrow(jwt.JsonWebTokenError);
    });

    it('verifyRefreshToken throws on invalid token', () => {
        expect(() => verifyRefreshToken('nope')).toThrow(jwt.JsonWebTokenError);
    });
});
