import { describe, expect, it } from 'vitest';
import { userIdParamsSchema } from '../../../http/schemas/user.schemas';

describe('http/schemas/user.schemas', () => {
    it('userIdParamsSchema: accepts uuid', () => {
        const out = userIdParamsSchema.parse({
            id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        });
        expect(out.id).toBe('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    });

    it('userIdParamsSchema: rejects non-uuid', () => {
        expect(() => userIdParamsSchema.parse({ id: 'nope' })).toThrow();
    });
});
