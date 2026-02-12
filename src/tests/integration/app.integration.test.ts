import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app';

describe('app (integration)', () => {
    const app = createApp();

    it('GET unknown route -> 404 NOT_FOUND envelope + x-request-id', async () => {
        const res = await request(app).get('/__nope__').expect(404);

        expect(res.headers['x-request-id']).toBeTruthy();
        expect(res.body).toEqual({
            error: {
                code: 'NOT_FOUND',
                message: 'Route not found',
                path: '/__nope__',
                requestId: res.headers['x-request-id'],
            },
        });
    });

    it('echoes incoming x-request-id', async () => {
        const res = await request(app)
            .get('/__nope__')
            .set('x-request-id', 'abc')
            .expect(404);

        expect(res.headers['x-request-id']).toBe('abc');
        expect(res.body.error.requestId).toBe('abc');
    });

    it('POST /auth/refresh without cookie -> 401 UNAUTHORIZED Missing refresh token', async () => {
        const res = await request(app).post('/auth/refresh').expect(401);

        expect(res.body.error.code).toBe('UNAUTHORIZED');
        expect(res.body.error.message).toBe('Missing refresh token');
        expect(res.body.error.requestId).toBeTruthy();
    });

    it('GET /users/me without accessToken -> 401 UNAUTHORIZED Missing access token', async () => {
        const res = await request(app).get('/users/me').expect(401);

        expect(res.body.error.code).toBe('UNAUTHORIZED');
        expect(res.body.error.message).toBe('Missing access token');
        expect(res.body.error.requestId).toBeTruthy();
    });

    it('malformed JSON body -> 400 INVALID_JSON', async () => {
        const res = await request(app)
            .post('/auth/login')
            .set('content-type', 'application/json')
            .send('}{')
            .expect(400);

        expect(res.body).toEqual({
            error: {
                code: 'INVALID_JSON',
                message: 'Malformed JSON body',
                requestId: res.headers['x-request-id'],
            },
        });
    });
});
