/**
 * permission-keys.
 * Used in:
 * - @Security(...)
 * - Services
 * - Seed
 */
export enum Permission {
    /** Read basic user profile */
    USERS_READ = 'users.read',

    /** View soft-deleted users */
    USERS_READ_DELETED = 'users.read_deleted',

    /** Ban/unban users */
    USERS_BAN = 'users.ban',

    /** Assign roles to users */
    ROLES_ASSIGN = 'roles.assign',
}

export enum Scope {
    /** Service scope: forces loading permissions into req.user.permissions */
    LOAD_PERMISSIONS = 'auth.load_permissions',
}
