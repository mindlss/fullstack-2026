import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => {
    const bucketExists = vi.fn();
    const makeBucket = vi.fn();
    const Client = vi.fn(function (this: any) {
        this.bucketExists = bucketExists;
        this.makeBucket = makeBucket;
    });
    const logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        fatal: vi.fn(),
    };

    return { Client, bucketExists, makeBucket, logger };
});

vi.mock('minio', () => ({ Client: h.Client }));
vi.mock('../../config/logger', () => ({ logger: h.logger }));
vi.mock('../../config/env', () => ({
    env: {
        MINIO_ENDPOINT: 'localhost',
        MINIO_PORT: 9000,
        MINIO_USE_SSL: 'false',
        MINIO_ACCESS_KEY: 'x',
        MINIO_SECRET_KEY: 'y',
        MINIO_BUCKET: 'bucket',
        NODE_ENV: 'test',
    },
}));

beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
});

async function importMinio() {
    return await import('../../lib/minio');
}

describe('lib/minio.ensureBucket', () => {
    it('creates bucket if not exists', async () => {
        h.bucketExists.mockResolvedValue(false);

        const { ensureBucket } = await importMinio();
        await ensureBucket();

        expect(h.makeBucket).toHaveBeenCalledWith('bucket');
    });

    it('does not create bucket if exists', async () => {
        h.bucketExists.mockResolvedValue(true);

        const { ensureBucket } = await importMinio();
        await ensureBucket();

        expect(h.makeBucket).not.toHaveBeenCalled();
    });
});
