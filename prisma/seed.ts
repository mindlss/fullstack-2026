import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/domain/auth/password.service';
import { env } from '../src/config/env';
import { Permission } from '../src/domain/auth/permissions';

async function upsertUser(params: {
    username: string;
    password: string;
    deleted?: boolean;
}) {
    const passwordHash = await hashPassword(params.password);

    return prisma.user.upsert({
        where: { username: params.username },
        update: {
            username: params.username,
            password: passwordHash,
            deletedAt: params.deleted ? new Date() : null,
        },
        create: {
            username: params.username,
            password: passwordHash,
            deletedAt: params.deleted ? new Date() : null,
        },
    });
}

async function upsertRole(params: {
    key: string;
    name: string;
    isSystem?: boolean;
}) {
    return prisma.role.upsert({
        where: { key: params.key },
        update: {
            name: params.name,
            isSystem: params.isSystem ?? true,
        },
        create: {
            key: params.key,
            name: params.name,
            isSystem: params.isSystem ?? true,
        },
    });
}

async function ensurePermissions() {
    const keys = Object.values(Permissions);

    // создаём permission записи (если уже есть — пропускаем)
    await prisma.permission.createMany({
        data: keys.map((key) => ({ key })),
        skipDuplicates: true,
    });

    // вернём map key -> id для связок
    const rows = await prisma.permission.findMany({
        where: { key: { in: keys } },
        select: { id: true, key: true },
    });

    return new Map(rows.map((p) => [p.key, p.id]));
}

async function setRolePermissions(
    roleId: string,
    permKeys: string[],
    permIdByKey: Map<string, string>,
) {
    await prisma.rolePermission.createMany({
        data: permKeys.map((k) => ({
            roleId,
            permissionId: permIdByKey.get(k)!,
        })),
        skipDuplicates: true,
    });
}

async function assignRole(params: {
    userId: string;
    roleId: string;
    createdById?: string;
}) {
    await prisma.roleAssignment.upsert({
        where: {
            userId_roleId: { userId: params.userId, roleId: params.roleId },
        },
        update: {},
        create: {
            userId: params.userId,
            roleId: params.roleId,
            createdById: params.createdById ?? null,
        },
    });
}

async function main() {
    console.log('🌱 Seeding...');

    // 1) permissions
    const permIdByKey = await ensurePermissions();

    // 2) roles
    const adminRole = await upsertRole({
        key: 'admin',
        name: 'Admin',
        isSystem: true,
    });
    const userRole = await upsertRole({
        key: 'user',
        name: 'User',
        isSystem: true,
    });
    const moderatorRole = await upsertRole({
        key: 'moderator',
        name: 'Moderator',
        isSystem: true,
    });

    // 3) role -> permissions
    const allPerms = Object.values(Permissions);

    await setRolePermissions(adminRole.id, allPerms, permIdByKey);

    await setRolePermissions(
        moderatorRole.id,
        [
            Permission.USERS_READ,
            Permission.USERS_READ_DELETED,
            Permission.USERS_BAN,
        ],
        permIdByKey,
    );

    await setRolePermissions(userRole.id, [Permission.USERS_READ], permIdByKey);

    // 4) users
    const admin = await upsertUser({
        username: env.SEED_ADMIN_USERNAME,
        password: env.SEED_ADMIN_PASSWORD,
    });

    const regular = await upsertUser({
        username: 'user',
        password: 'user12345',
    });

    const deletedUser = await upsertUser({
        username: 'deleted_user',
        password: 'deleted_user12345',
        deleted: true,
    });

    // 5) assignments
    await assignRole({
        userId: admin.id,
        roleId: adminRole.id,
        createdById: admin.id,
    });
    await assignRole({
        userId: regular.id,
        roleId: userRole.id,
        createdById: admin.id,
    });
    await assignRole({
        userId: deletedUser.id,
        roleId: userRole.id,
        createdById: admin.id,
    });

    console.log('✅ Seed done');
    console.log('Users:', [
        {
            username: admin.username,
            roles: ['admin'],
            deletedAt: admin.deletedAt,
        },
        {
            username: regular.username,
            roles: ['user'],
            deletedAt: regular.deletedAt,
        },
        {
            username: deletedUser.username,
            roles: ['user'],
            deletedAt: deletedUser.deletedAt,
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
