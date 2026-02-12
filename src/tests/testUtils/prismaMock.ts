import { vi } from 'vitest';

export const prismaMock = {
    user: {
        create: vi.fn(),
        findUnique: vi.fn(),
    },
    role: {
        findUnique: vi.fn(),
    },
    roleAssignment: {
        upsert: vi.fn(),
        findMany: vi.fn(),
    },
    permission: {
        findMany: vi.fn(),
    },
};
