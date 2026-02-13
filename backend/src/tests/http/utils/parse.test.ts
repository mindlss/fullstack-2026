import { describe, it, expect } from 'vitest';
import { z } from 'zod';

import { parseBody, parseQuery, parseParams } from '../../../http/utils/parse';

describe('http/utils/parse', () => {
    it('parseBody returns parsed data', () => {
        const schema = z.object({ a: z.coerce.number() });
        const out = parseBody(schema, { a: '123' });
        expect(out).toEqual({ a: 123 });
    });

    it('parseBody throws ApiError 400 VALIDATION_ERROR with message/details', () => {
        const schema = z.object({ a: z.number() });

        try {
            parseBody(schema, { a: 'nope' });
            throw new Error('should not reach');
        } catch (err: any) {
            expect(err).toMatchObject({
                name: 'ApiError',
                status: 400,
                code: 'VALIDATION_ERROR',
                message: 'Invalid request body',
            });
            expect(err.details).toHaveProperty('issues');
        }
    });

    it('parseQuery throws with query message', () => {
        const schema = z.object({ q: z.string().min(2) });

        try {
            parseQuery(schema, { q: 'x' });
            throw new Error('should not reach');
        } catch (err: any) {
            expect(err).toMatchObject({
                name: 'ApiError',
                status: 400,
                code: 'VALIDATION_ERROR',
                message: 'Invalid query parameters',
            });
            expect(err.details).toHaveProperty('issues');
        }
    });

    it('parseParams throws with params message', () => {
        const schema = z.object({ id: z.string().uuid() });

        try {
            parseParams(schema, { id: 'nope' });
            throw new Error('should not reach');
        } catch (err: any) {
            expect(err).toMatchObject({
                name: 'ApiError',
                status: 400,
                code: 'VALIDATION_ERROR',
                message: 'Invalid route parameters',
            });
            expect(err.details).toHaveProperty('issues');
        }
    });
});
