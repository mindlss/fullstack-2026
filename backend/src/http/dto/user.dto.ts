export type UserPublicDTO = {
    id: string;
    username: string;
    createdAt: string;
};

export function toUserPublicDTO(u: any): UserPublicDTO {
    return {
        id: u.id,
        username: u.username,
        createdAt: new Date(u.createdAt).toISOString(),
    };
}

export type UserSelfDTO = {
    id: string;
    username: string;
    createdAt: string;
    updatedAt: string;
    isBanned: boolean;

    roles: string[];
    permissions: string[];
};

export function toUserSelfDTO(u: any): UserSelfDTO {
    return {
        id: u.id,
        username: u.username,
        createdAt: new Date(u.createdAt).toISOString(),
        updatedAt: new Date(u.updatedAt).toISOString(),
        isBanned: !!u.isBanned,

        roles: Array.isArray(u.roles) ? u.roles : [],
        permissions: Array.isArray(u.permissions) ? u.permissions : [],
    };
}

export type UserPublicResponseDTO = UserPublicDTO;
export type UserSelfResponseDTO = UserSelfDTO;
