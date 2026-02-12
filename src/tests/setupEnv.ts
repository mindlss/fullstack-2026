process.env.NODE_ENV = 'test';

process.env.DATABASE_URL =
    process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/test';
process.env.MINIO_ENDPOINT = process.env.MINIO_ENDPOINT ?? 'localhost';
process.env.MINIO_PORT = process.env.MINIO_PORT ?? '9000';
process.env.MINIO_USE_SSL = process.env.MINIO_USE_SSL ?? 'false';
process.env.MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY ?? 'minio';
process.env.MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY ?? 'miniosecret';
process.env.MINIO_BUCKET = process.env.MINIO_BUCKET ?? 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'x'.repeat(32);
process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET ?? 'y'.repeat(32);

process.env.LOG_TO_FILE = process.env.LOG_TO_FILE ?? 'false';
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? 'silent';
