import { describe, it, expect } from 'vitest';
import { makeReq, makeRes } from '../testUtils/http';
import { notFoundMiddleware } from '../../http/middlewares/notFound.middleware';

describe('notFoundMiddleware', () => {
    it('returns 404 envelope with path and requestId (if present)', () => {
        const req = makeReq({ path: '/nope' } as any);
        (req as any).requestId = 'rid-1';

        const r = makeRes();
        notFoundMiddleware(req, r.res, () => {});

        expect(r.statusCode).toBe(404);
        expect(r.jsonBody).toEqual({
            error: {
                code: 'NOT_FOUND',
                message: 'Route not found',
                path: '/nope',
                requestId: 'rid-1',
            },
        });
    });

    it('does not include requestId if missing', () => {
        const req = makeReq({ path: '/nope' } as any);

        const r = makeRes();
        notFoundMiddleware(req, r.res, () => {});

        expect(r.statusCode).toBe(404);
        expect(r.jsonBody.error.code).toBe('NOT_FOUND');
        expect(r.jsonBody.error.path).toBe('/nope');
        expect('requestId' in r.jsonBody.error).toBe(false);
    });
});
