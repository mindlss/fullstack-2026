import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { v4 as uuidv4 } from 'uuid';
import { isTokenRevoked } from './tokenBlacklist.service';

type TokenPayload = {
    sub: string;
    jti: string;
    iat: number;
    exp: number;
};

type SignInput = {
    sub: string;
};

export function signAccessToken(payload: SignInput): string {
    return jwt.sign({ sub: payload.sub, jti: uuidv4() }, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN,
    });
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;

    if (!decoded.jti || !decoded.exp) {
        throw new jwt.JsonWebTokenError('Invalid token payload');
    }

    const revoked = await isTokenRevoked({ kind: 'access', jti: decoded.jti });
    if (revoked) {
        throw new jwt.JsonWebTokenError('Token revoked');
    }

    return decoded;
}

export function signRefreshToken(payload: SignInput): string {
    return jwt.sign(
        { sub: payload.sub, jti: uuidv4() },
        env.JWT_REFRESH_SECRET,
        { expiresIn: env.JWT_REFRESH_EXPIRES_IN },
    );
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;

    if (!decoded.jti || !decoded.exp) {
        throw new jwt.JsonWebTokenError('Invalid token payload');
    }

    const revoked = await isTokenRevoked({ kind: 'refresh', jti: decoded.jti });
    if (revoked) {
        throw new jwt.JsonWebTokenError('Token revoked');
    }

    return decoded;
}
