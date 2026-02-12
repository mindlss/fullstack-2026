import { describe, expect, it, vi } from 'vitest';

vi.mock('argon2', () => {
    return {
        default: {
            hash: vi.fn(async (password: string) => `hashed:${password}`),
            verify: vi.fn(
                async (hash: string, password: string) =>
                    hash === `hashed:${password}`,
            ),
        },
    };
});

import argon2 from 'argon2';
import {
    hashPassword,
    verifyPassword,
} from '../../domain/auth/password.service';

describe('domain/auth/password.service', () => {
    it('hashPassword proxies to argon2.hash', async () => {
        await expect(hashPassword('secret')).resolves.toBe('hashed:secret');
        expect((argon2 as any).hash).toHaveBeenCalledTimes(1);
        expect((argon2 as any).hash).toHaveBeenCalledWith('secret');
    });

    it('verifyPassword proxies to argon2.verify', async () => {
        await expect(verifyPassword('hashed:ok', 'ok')).resolves.toBe(true);
        await expect(verifyPassword('hashed:no', 'ok')).resolves.toBe(false);

        expect((argon2 as any).verify).toHaveBeenCalledTimes(2);
        expect((argon2 as any).verify).toHaveBeenNthCalledWith(
            1,
            'hashed:ok',
            'ok',
        );
        expect((argon2 as any).verify).toHaveBeenNthCalledWith(
            2,
            'hashed:no',
            'ok',
        );
    });
});
