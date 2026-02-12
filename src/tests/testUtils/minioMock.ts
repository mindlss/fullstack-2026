import { vi } from 'vitest';

export const minioMock = {
    bucketExists: vi.fn(),
    makeBucket: vi.fn(),
};
