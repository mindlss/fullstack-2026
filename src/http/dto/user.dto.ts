import { UserRole } from '@prisma/client';

export type UserPublicDTO = {
    id: string;
    username: string;
    role: UserRole;

    createdAt: string;
};

export function toUserPublicDTO(u: any): UserPublicDTO {
    return {
        id: u.id,
        username: u.username,
        role: u.role,

        createdAt: new Date(u.createdAt).toISOString(),
    };
}

export type UserSelfDTO = {
    id: string;
    username: string;
    role: UserRole;

    createdAt: string;
    updatedAt: string;

    isBanned: boolean;
};

export function toUserSelfDTO(u: any): UserSelfDTO {
    return {
        id: u.id,
        username: u.username,
        role: u.role,

        createdAt: new Date(u.createdAt).toISOString(),
        updatedAt: new Date(u.updatedAt).toISOString(),

        isBanned: !!u.isBanned,
    };
}

export type UserPublicResponseDTO = UserPublicDTO;
export type UserSelfResponseDTO = UserSelfDTO;
