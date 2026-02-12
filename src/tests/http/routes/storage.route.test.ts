import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

import { minioMock } from '../../testUtils/minioMock';

vi.mock('../../../lib/minio', () => ({
    minio: minioMock,
}));

import { env } from '../../../config/env';
import { storageRouter } from '../../../http/routes/storage.route';

describe('http/routes/storage.route', () => {
    beforeEach(() => vi.clearAllMocks());

    it('GET /storage/ping returns bucket + exists', async () => {
        minioMock.bucketExists.mockResolvedValue(true);

        const app = express();
        app.use(storageRouter);

        const res = await request(app).get('/storage/ping').expect(200);

        expect(minioMock.bucketExists).toHaveBeenCalledWith(env.MINIO_BUCKET);
        expect(res.body).toEqual({
            status: 'ok',
            bucket: env.MINIO_BUCKET,
            exists: true,
        });
    });
});
