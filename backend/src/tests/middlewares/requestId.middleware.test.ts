import { describe, it, expect, vi } from 'vitest';
import { makeReq, makeRes } from '../testUtils/http';
import { requestIdMiddleware } from '../../http/middlewares/requestId.middleware';

describe('requestIdMiddleware', () => {
    it('uses incoming x-request-id when length <= 100', () => {
        const req = makeReq({ headers: { 'x-request-id': 'abc' } as any });
        const { res, headers } = makeRes();

        const next = vi.fn();
        requestIdMiddleware(req, res, next);

        expect((req as any).requestId).toBe('abc');
        expect(headers['x-request-id']).toBe('abc');
        expect(next).toHaveBeenCalledOnce();
    });

    it('generates uuid when x-request-id is missing', () => {
        const req = makeReq({ headers: {} as any });
        const { res, headers } = makeRes();

        const next = vi.fn();
        requestIdMiddleware(req, res, next);

        expect(typeof (req as any).requestId).toBe('string');
        expect((req as any).requestId.length).toBeGreaterThan(10);
        expect(headers['x-request-id']).toBe((req as any).requestId);
        expect(next).toHaveBeenCalledOnce();
    });

    it('ignores too long x-request-id (>100)', () => {
        const long = 'a'.repeat(101);
        const req = makeReq({ headers: { 'x-request-id': long } as any });
        const { res, headers } = makeRes();

        const next = vi.fn();
        requestIdMiddleware(req, res, next);

        expect((req as any).requestId).not.toBe(long);
        expect(headers['x-request-id']).toBe((req as any).requestId);
        expect(next).toHaveBeenCalledOnce();
    });
});
