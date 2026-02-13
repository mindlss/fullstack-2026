import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const r = vi.hoisted(() => {
    return {
        set: vi.fn(),
        get: vi.fn(),
    };
});

vi.mock('../../lib/redis', () => ({
    redis: {
        set: r.set,
        get: r.get,
    },
}));

import {
    blacklistKey,
    revokeToken,
    isTokenRevoked,
} from '../../domain/auth/tokenBlacklist.service';

describe('tokenBlacklist.service', () => {
    const fixedNowMs = 1_700_000_000_000; // 1700000000 sec

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(Date, 'now').mockReturnValue(fixedNowMs);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('blacklistKey builds key', () => {
        expect(blacklistKey('access', 'j1')).toBe('bl:access:j1');
        expect(blacklistKey('refresh', 'j2')).toBe('bl:refresh:j2');
    });

    it('revokeToken: does nothing if ttl <= 0', async () => {
        await revokeToken({ kind: 'access', jti: 'j1', exp: 1_700_000_000 });
        expect(r.set).not.toHaveBeenCalled();

        await revokeToken({ kind: 'refresh', jti: 'j2', exp: 1_699_999_999 });
        expect(r.set).not.toHaveBeenCalled();
    });

    it('revokeToken: sets key with EX ttl when ttl > 0', async () => {
        await revokeToken({ kind: 'access', jti: 'j3', exp: 1_700_000_012 });

        expect(r.set).toHaveBeenCalledTimes(1);
        expect(r.set).toHaveBeenCalledWith('bl:access:j3', '1', 'EX', 12);
    });

    it('isTokenRevoked: returns true when value is "1"', async () => {
        r.get.mockResolvedValue('1');
        await expect(
            isTokenRevoked({ kind: 'access', jti: 'j1' }),
        ).resolves.toBe(true);
        expect(r.get).toHaveBeenCalledWith('bl:access:j1');
    });

    it('isTokenRevoked: returns false when value is null/other', async () => {
        r.get.mockResolvedValue(null);
        await expect(
            isTokenRevoked({ kind: 'refresh', jti: 'j9' }),
        ).resolves.toBe(false);

        r.get.mockResolvedValue('0');
        await expect(
            isTokenRevoked({ kind: 'refresh', jti: 'j9' }),
        ).resolves.toBe(false);
    });
});
