import { http } from './http';
import type { UserPublicDTO, UserSelfDTO } from './types';

export const usersApi = {
    me() {
        return http<UserSelfDTO>({
            method: 'GET',
            path: '/users/me',
        });
    },

    getPublic(id: string) {
        return http<UserPublicDTO>({
            method: 'GET',
            path: `/users/${encodeURIComponent(id)}`,
        });
    },
};
