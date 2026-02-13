import { http } from './http';
import type { HealthDTO, OkDTO, StoragePingDTO } from './types';

export const healthApi = {
    health() {
        return http<HealthDTO>({
            method: 'GET',
            path: '/health',
        });
    },

    dbPing() {
        return http<OkDTO>({
            method: 'GET',
            path: '/db/ping',
        });
    },

    storagePing() {
        return http<StoragePingDTO>({
            method: 'GET',
            path: '/storage/ping',
        });
    },

    redisPing() {
        return http<OkDTO>({
            method: 'GET',
            path: '/redis/ping',
        });
    },
};
