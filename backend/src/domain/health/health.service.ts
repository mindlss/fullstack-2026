import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { minio } from '../../lib/minio';
import { redis } from '../../lib/redis';

export async function pingDb(): Promise<void> {
    await prisma.$queryRaw`SELECT 1`;
}

export function getHealth() {
    return {
        status: 'ok' as const,
        env: env.NODE_ENV,
        timestamp: new Date().toISOString(),
        uptimeSec: Math.floor(process.uptime()),
    };
}

export async function pingStorage(): Promise<{
    bucket: string;
    exists: boolean;
}> {
    const exists = await minio.bucketExists(env.MINIO_BUCKET);
    return { bucket: env.MINIO_BUCKET, exists };
}

export async function pingRedis(): Promise<void> {
    const res = await redis.ping();
    if (res !== 'PONG') {
        throw new Error(`Redis ping failed: ${res}`);
    }
}
