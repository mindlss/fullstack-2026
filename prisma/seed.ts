import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/domain/auth/password.service';
import { env } from '../src/config/env';
import { UserRole } from '@prisma/client';

async function upsertUser(params: {
    username: string;
    password: string;
    role: UserRole;
}) {
    const passwordHash = await hashPassword(params.password);

    return prisma.user.upsert({
        where: { username: params.username },
        update: {
            username: params.username,
            password: passwordHash,
            role: params.role,
        },
        create: {
            username: params.username,
            password: passwordHash,
            role: params.role,
        },
    });
}

async function seedRoleQuotas() {
    const quotas = [
        {
            role: UserRole.GUEST,
            quotas: { daily_uploads: 0, max_file_size: 0, total_uploads: 0 },
        },
        {
            role: UserRole.UNVERIFIED,
            quotas: { daily_uploads: 0, max_file_size: 0, total_uploads: 0 },
        },
        {
            role: UserRole.USER,
            quotas: { daily_uploads: 0, max_file_size: 0, total_uploads: 0 },
        },
        {
            role: UserRole.TRUSTED,
            quotas: {
                daily_uploads: 50,
                max_file_size: 104857600,
                total_uploads: 0,
            },
        },
        {
            role: UserRole.MODERATOR,
            quotas: {
                daily_uploads: 200,
                max_file_size: 209715200,
                total_uploads: 0,
            },
        },
        {
            role: UserRole.ADMIN,
            quotas: {
                daily_uploads: 1000,
                max_file_size: 1073741824,
                total_uploads: 0,
            },
        },
    ];

    for (const q of quotas) {
        await prisma.roleQuota.upsert({
            where: { role: q.role },
            update: { quotas: q.quotas },
            create: { role: q.role, quotas: q.quotas },
        });
    }
}

async function main() {
    console.log('🌱 Seeding...');

    await seedRoleQuotas();

    const admin = await upsertUser({
        username: env.SEED_ADMIN_USERNAME,
        password: env.SEED_ADMIN_PASSWORD,
        role: UserRole.ADMIN,
    });

    console.log('✅ Seed done');
    console.log('Users:', [
        {
            username: admin.username,
            role: admin.role,
        },
    ]);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
