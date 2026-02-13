import { describe, it, expect } from 'vitest';
import { ZodError, z } from 'zod';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { ValidateError } from 'tsoa';

import { makeReq, makeRes } from '../testUtils/http';
import { errorMiddleware } from '../../http/middlewares/error.middleware';
import { apiError } from '../../http/errors/ApiError';

function run(err: unknown, reqPatch?: any) {
    const req = makeReq({ path: '/x', method: 'POST', ...reqPatch } as any);
    (req as any).requestId = 'rid-x';
    const r = makeRes();
    errorMiddleware(err, req, r.res, () => {});
    return r;
}

describe('errorMiddleware', () => {
    it('maps tsoa ValidateError -> 400 VALIDATION_ERROR with fields', () => {
        const err = new ValidateError(
            {
                body: {
                    message: 'invalid',
                    value: null,
                } as any,
            },
            'Invalid request',
        );

        const r = run(err);

        expect(r.statusCode).toBe(400);
        expect(r.jsonBody.error.code).toBe('VALIDATION_ERROR');
        expect(r.jsonBody.error.details.fields).toBeDefined();
        expect(r.jsonBody.error.requestId).toBe('rid-x');
    });

    it('maps ApiError -> its status/code/message/details', () => {
        const err = apiError(403, 'FORBIDDEN', 'Nope', { a: 1 });
        const r = run(err);

        expect(r.statusCode).toBe(403);
        expect(r.jsonBody).toEqual({
            error: {
                code: 'FORBIDDEN',
                message: 'Nope',
                details: { a: 1 },
                requestId: 'rid-x',
            },
        });
    });

    it('maps ZodError -> 400 VALIDATION_ERROR with issues', () => {
        const schema = z.object({ username: z.string().min(3) });
        let err: ZodError;
        try {
            schema.parse({ username: 'a' });
            throw new Error('should throw');
        } catch (e) {
            err = e as ZodError;
        }

        const r = run(err);

        expect(r.statusCode).toBe(400);
        expect(r.jsonBody.error.code).toBe('VALIDATION_ERROR');
        expect(Array.isArray(r.jsonBody.error.details.issues)).toBe(true);
    });

    it('maps invalid JSON SyntaxError -> 400 INVALID_JSON', () => {
        const err: any = new SyntaxError('Unexpected token } in JSON');
        err.type = 'entity.parse.failed';

        const r = run(err);

        expect(r.statusCode).toBe(400);
        expect(r.jsonBody).toEqual({
            error: {
                code: 'INVALID_JSON',
                message: 'Malformed JSON body',
                requestId: 'rid-x',
            },
        });
    });

    it('maps TokenExpiredError -> 401 TOKEN_EXPIRED', () => {
        const err = new jwt.TokenExpiredError('jwt expired', new Date());
        const r = run(err);

        expect(r.statusCode).toBe(401);
        expect(r.jsonBody.error.code).toBe('TOKEN_EXPIRED');
    });

    it('maps NotBeforeError -> 401 TOKEN_NOT_ACTIVE', () => {
        const err = new jwt.NotBeforeError('jwt not active', new Date());
        const r = run(err);

        expect(r.statusCode).toBe(401);
        expect(r.jsonBody.error.code).toBe('TOKEN_NOT_ACTIVE');
    });

    it('maps JsonWebTokenError -> 401 INVALID_TOKEN', () => {
        const err = new jwt.JsonWebTokenError('invalid token');
        const r = run(err);

        expect(r.statusCode).toBe(401);
        expect(r.jsonBody.error.code).toBe('INVALID_TOKEN');
    });

    it('maps Prisma P2002 -> 409 CONFLICT with target', () => {
        const err = new Prisma.PrismaClientKnownRequestError(
            'Unique constraint',
            {
                code: 'P2002',
                clientVersion: '5.18.0',
                meta: { target: ['User_username_key'] },
            },
        );

        const r = run(err);

        expect(r.statusCode).toBe(409);
        expect(r.jsonBody.error.code).toBe('CONFLICT');
        expect(r.jsonBody.error.details.target).toEqual(['User_username_key']);
    });

    it('maps Prisma P2025 -> 404 NOT_FOUND', () => {
        const err = new Prisma.PrismaClientKnownRequestError(
            'Record not found',
            { code: 'P2025', clientVersion: '5.18.0' },
        );

        const r = run(err);

        expect(r.statusCode).toBe(404);
        expect(r.jsonBody.error.code).toBe('NOT_FOUND');
    });

    it('maps Prisma P2003 -> 409 CONFLICT with field_name', () => {
        const err = new Prisma.PrismaClientKnownRequestError('FK constraint', {
            code: 'P2003',
            clientVersion: '5.18.0',
            meta: { field_name: 'userId' },
        });

        const r = run(err);

        expect(r.statusCode).toBe(409);
        expect(r.jsonBody.error.code).toBe('CONFLICT');
        expect(r.jsonBody.error.details.field_name).toBe('userId');
    });

    it('maps other Prisma known errors -> 400 DB_ERROR', () => {
        const err = new Prisma.PrismaClientKnownRequestError(
            'Other prisma err',
            { code: 'P9999', clientVersion: '5.18.0' },
        );

        const r = run(err);

        expect(r.statusCode).toBe(400);
        expect(r.jsonBody.error.code).toBe('DB_ERROR');
        expect(r.jsonBody.error.details.prismaCode).toBe('P9999');
    });

    it('fallback -> 500 INTERNAL_SERVER_ERROR', () => {
        const r = run(new Error('boom'));

        expect(r.statusCode).toBe(500);
        expect(r.jsonBody.error.code).toBe('INTERNAL_SERVER_ERROR');
        expect(r.jsonBody.error.requestId).toBe('rid-x');
    });
});
