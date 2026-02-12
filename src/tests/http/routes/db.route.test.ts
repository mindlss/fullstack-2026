import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

import { prismaMock } from '../../testUtils/prismaMock';

vi.mock('../../../lib/prisma', () => ({ prisma: prismaMock }));

import { dbRouter } from '../../../http/routes/db.route';

describe('http/routes/db.route', () => {
    beforeEach(() => vi.clearAllMocks());

    it('GET /db/ping -> 200 {status:"ok"} and SELECT 1 executed', async () => {
        (prismaMock as any).$queryRaw = vi
            .fn()
            .mockResolvedValue([{ '?column?': 1 }]);

        const app = express();
        app.use(dbRouter);

        const res = await request(app).get('/db/ping').expect(200);

        expect((prismaMock as any).$queryRaw).toHaveBeenCalledOnce();
        expect(res.body).toEqual({ status: 'ok' });
    });
});
