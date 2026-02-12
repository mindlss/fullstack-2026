import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';

import { healthRouter } from '../../../http/routes/health.route';
import { env } from '../../../config/env';

describe('http/routes/health.route', () => {
    it('GET /health returns ok envelope', async () => {
        const app = express();
        app.use(healthRouter);

        const res = await request(app).get('/health').expect(200);

        expect(res.body.status).toBe('ok');
        expect(res.body.env).toBe(env.NODE_ENV);
        expect(typeof res.body.timestamp).toBe('string');
        expect(Number.isFinite(Date.parse(res.body.timestamp))).toBe(true);
        expect(typeof res.body.uptimeSec).toBe('number');
    });
});
