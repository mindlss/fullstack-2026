import { http } from './http';
import type {
    AuthResponseDTO,
    LoginBodyDTO,
    OkDTO,
    RegisterBodyDTO,
} from './types';

export const authApi = {
    register(body: RegisterBodyDTO) {
        return http<AuthResponseDTO>({
            method: 'POST',
            path: '/auth/register',
            body,
        });
    },

    login(body: LoginBodyDTO) {
        return http<AuthResponseDTO>({
            method: 'POST',
            path: '/auth/login',
            body,
        });
    },

    refresh() {
        return http<OkDTO>({
            method: 'POST',
            path: '/auth/refresh',
        });
    },

    logout() {
        return http<OkDTO>({
            method: 'POST',
            path: '/auth/logout',
        });
    },
};
