export type HealthDTO = {
    status: 'ok';
    env: string;
    timestamp: string;
    uptimeSec: number;
};

export type DbPingDTO = { status: 'ok' };

export type StoragePingDTO = {
    status: 'ok';
    bucket: string;
    exists: boolean;
};

export type RedisPingDTO = {
    status: 'ok';
};
