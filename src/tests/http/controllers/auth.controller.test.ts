import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => {
    const registerUser = vi.fn();
    const loginUser = vi.fn();

    const signAccessToken = vi.fn();
    const signRefreshToken = vi.fn();
    const verifyRefreshToken = vi.fn();

    return {
        registerUser,
        loginUser,
        signAccessToken,
        signRefreshToken,
        verifyRefreshToken,
    };
});

vi.mock('../../../domain/auth/auth.service', () => ({
    registerUser: h.registerUser,
    loginUser: h.loginUser,
}));

vi.mock('../../../domain/auth/token.service', () => ({
    signAccessToken: h.signAccessToken,
    signRefreshToken: h.signRefreshToken,
    verifyRefreshToken: h.verifyRefreshToken,
}));

async function importAuthController() {
    const mod = await import('../../../http/controllers/auth.controller');
    return mod.AuthController;
}

function makeRes() {
    return {
        cookie: vi.fn(),
    } as any;
}

function makeReq(params?: { res?: any; cookies?: any }) {
    return {
        res: params?.res,
        cookies: params?.cookies,
    } as any;
}

function expectCookieCall(
    res: any,
    name: string,
    value: string,
    optsMatcher: Record<string, any>,
) {
    const call = res.cookie.mock.calls.find((c: any[]) => c[0] === name);
    expect(call, `cookie(${name}) was not set`).toBeTruthy();
    expect(call[1]).toBe(value);
    expect(call[2]).toEqual(expect.objectContaining(optsMatcher));
}

beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
});

describe('http/controllers/auth.controller', () => {
    it('register: sets cookies, setsStatus(201), returns DTO', async () => {
        vi.doMock('../../../config/env', () => ({
            env: {
                NODE_ENV: 'production',
                JWT_EXPIRES_IN: 60, // sec
                JWT_REFRESH_EXPIRES_IN: 3600, // sec
            },
        }));

        const AuthController = await importAuthController();
        const ctrl = new AuthController();

        const res = makeRes();
        const req = makeReq({ res });

        h.registerUser.mockResolvedValue({
            user: {
                id: 'u1',
                username: 'bob',
                createdAt: new Date('2020-01-01T00:00:00.000Z'),
                updatedAt: new Date('2020-01-01T00:00:00.000Z'),
                deletedAt: null,
                isBanned: false,
            },
            token: 'access-1',
            refreshToken: 'refresh-1',
        });

        const setStatusSpy = vi.spyOn(ctrl as any, 'setStatus');

        const out = await ctrl.register(
            { username: 'bob', password: 'password123' } as any,
            req,
        );

        expect(h.registerUser).toHaveBeenCalledTimes(1);
        expect(setStatusSpy).toHaveBeenCalledWith(201);

        expectCookieCall(res, 'accessToken', 'access-1', {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 1000,
        });
        expectCookieCall(res, 'refreshToken', 'refresh-1', {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/auth/refresh',
            maxAge: 3600 * 1000,
        });

        expect(out.user.id).toBe('u1');
        expect(out.user.username).toBe('bob');
    });

    it('login: sets cookies and returns DTO', async () => {
        vi.doMock('../../../config/env', () => ({
            env: {
                NODE_ENV: 'development',
                JWT_EXPIRES_IN: 10,
                JWT_REFRESH_EXPIRES_IN: 20,
            },
        }));

        const AuthController = await importAuthController();
        const ctrl = new AuthController();

        const res = makeRes();
        const req = makeReq({ res });

        h.loginUser.mockResolvedValue({
            user: {
                id: 'u2',
                username: 'alice',
                createdAt: new Date('2020-01-01T00:00:00.000Z'),
                updatedAt: new Date('2020-01-01T00:00:00.000Z'),
                deletedAt: null,
                isBanned: false,
            },
            token: 'access-2',
            refreshToken: 'refresh-2',
        });

        const out = await ctrl.login(
            { username: 'alice', password: 'password123' } as any,
            req,
        );

        expect(h.loginUser).toHaveBeenCalledTimes(1);

        expectCookieCall(res, 'accessToken', 'access-2', {
            secure: false,
            path: '/',
            maxAge: 10 * 1000,
        });
        expectCookieCall(res, 'refreshToken', 'refresh-2', {
            secure: false,
            path: '/auth/refresh',
            maxAge: 20 * 1000,
        });

        expect(out.user.id).toBe('u2');
    });

    it('refresh: 401 if missing refresh token cookie', async () => {
        vi.doMock('../../../config/env', () => ({
            env: {
                NODE_ENV: 'production',
                JWT_EXPIRES_IN: 1,
                JWT_REFRESH_EXPIRES_IN: 2,
            },
        }));

        const AuthController = await importAuthController();
        const ctrl = new AuthController();

        const res = makeRes();
        const req = makeReq({ res, cookies: {} });

        await expect(ctrl.refresh(req)).rejects.toMatchObject({
            name: 'ApiError',
            status: 401,
            code: 'UNAUTHORIZED',
        });
    });

    it('refresh: 401 if refresh token invalid', async () => {
        vi.doMock('../../../config/env', () => ({
            env: {
                NODE_ENV: 'production',
                JWT_EXPIRES_IN: 1,
                JWT_REFRESH_EXPIRES_IN: 2,
            },
        }));

        const AuthController = await importAuthController();
        const ctrl = new AuthController();

        const res = makeRes();
        const req = makeReq({ res, cookies: { refreshToken: 'bad' } });

        h.verifyRefreshToken.mockImplementation(() => {
            throw new Error('bad token');
        });

        await expect(ctrl.refresh(req)).rejects.toMatchObject({
            name: 'ApiError',
            status: 401,
            code: 'UNAUTHORIZED',
        });
    });

    it('refresh: sets new cookies and returns ok', async () => {
        vi.doMock('../../../config/env', () => ({
            env: {
                NODE_ENV: 'production',
                JWT_EXPIRES_IN: 10,
                JWT_REFRESH_EXPIRES_IN: 20,
            },
        }));

        const AuthController = await importAuthController();
        const ctrl = new AuthController();

        const res = makeRes();
        const req = makeReq({ res, cookies: { refreshToken: 'r1' } });

        h.verifyRefreshToken.mockReturnValue({ sub: 'u9' });
        h.signAccessToken.mockReturnValue('new-access');
        h.signRefreshToken.mockReturnValue('new-refresh');

        const out = await ctrl.refresh(req);

        expect(h.verifyRefreshToken).toHaveBeenCalledWith('r1');
        expect(h.signAccessToken).toHaveBeenCalledWith({ sub: 'u9' });
        expect(h.signRefreshToken).toHaveBeenCalledWith({ sub: 'u9' });

        expectCookieCall(res, 'accessToken', 'new-access', {
            path: '/',
            maxAge: 10 * 1000,
        });
        expectCookieCall(res, 'refreshToken', 'new-refresh', {
            path: '/auth/refresh',
            maxAge: 20 * 1000,
        });

        expect(out).toEqual({ status: 'ok' });
    });

    it('logout: clears cookies', async () => {
        vi.doMock('../../../config/env', () => ({
            env: {
                NODE_ENV: 'production',
                JWT_EXPIRES_IN: 10,
                JWT_REFRESH_EXPIRES_IN: 20,
            },
        }));

        const AuthController = await importAuthController();
        const ctrl = new AuthController();

        const res = makeRes();
        const req = makeReq({ res });

        const out = await ctrl.logout(req);

        expectCookieCall(res, 'accessToken', '', { path: '/', maxAge: 0 });
        expectCookieCall(res, 'refreshToken', '', {
            path: '/auth/refresh',
            maxAge: 0,
        });

        expect(out).toEqual({ status: 'ok' });
    });

    it('mustGetRes: throws 500 if req.res missing', async () => {
        vi.doMock('../../../config/env', () => ({
            env: {
                NODE_ENV: 'production',
                JWT_EXPIRES_IN: 10,
                JWT_REFRESH_EXPIRES_IN: 20,
            },
        }));

        const AuthController = await importAuthController();
        const ctrl = new AuthController();

        h.loginUser.mockResolvedValue({
            user: {
                id: 'u1',
                username: 'bob',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            token: 't',
            refreshToken: 'r',
        });

        const req = makeReq({ res: undefined });

        await expect(
            ctrl.login(
                { username: 'bob', password: 'password123' } as any,
                req,
            ),
        ).rejects.toMatchObject({
            name: 'ApiError',
            status: 500,
        });
    });
});
