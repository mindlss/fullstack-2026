export type UserSelfDTO = {
    permissions: string[];
    roles: string[];
    isBanned: boolean;
    updatedAt: string;
    createdAt: string;
    username: string;
    id: string;
};

export type UserPublicDTO = {
    createdAt: string;
    username: string;
    id: string;
};

export type AuthResponseDTO = {
    user: UserSelfDTO;
};

export type ErrorEnvelopeDTO = {
    error: {
        requestId?: string;
        details?: unknown;
        message?: string;
        code: string;
    };
};

export type RegisterBodyDTO = {
    password: string;
    username: string;
};

export type LoginBodyDTO = {
    password: string;
    username: string;
};

export type OkDTO = {
    status: 'ok';
};

export type HealthDTO = {
    status: 'ok';
    env: string;
    timestamp: string;
    uptimeSec: number;
};

export type StoragePingDTO = {
    status: 'ok';
    bucket: string;
    exists: boolean;
};
