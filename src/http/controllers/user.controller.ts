import { Controller, Get, Path, Request, Route, Security, Tags } from 'tsoa';
import type { Request as ExpressRequest } from 'express';

import { apiError } from '../errors/ApiError';

import { userIdParamsSchema } from '../schemas/user.schemas';

import {
    getUserPublicById,
    getUserRoleKeys,
    getUserSelf,
} from '../../domain/users/user.service';

import { toUserPublicDTO, toUserSelfDTO } from '../dto/user.dto';

import type { UserPublicDTO, UserSelfDTO } from '../dto/user.dto';

import { Scope } from '../../domain/auth/permissions';

@Route('users')
@Tags('Users')
export class UsersController extends Controller {
    /**
     * GET /users/me
     * auth required
     */
    @Get('me')
    @Security('cookieAuth', [Scope.LOAD_PERMISSIONS])
    public async getMe(@Request() req: ExpressRequest): Promise<UserSelfDTO> {
        const user = await getUserSelf(req.user!.id);
        if (!user) throw apiError(401, 'UNAUTHORIZED', 'User not found');

        const roles = await getUserRoleKeys(req.user!.id);

        return toUserSelfDTO({
            ...user,
            roles,
            permissions: req.user?.permissions ?? [],
        });
    }

    /**
     * GET /users/:id
     * public profile, viewer-aware
     */
    @Get('{id}')
    @Security('optionalCookieAuth')
    public async getUserPublic(
        @Path() id: string,
        @Request() req: ExpressRequest,
    ): Promise<UserPublicDTO> {
        const params = userIdParamsSchema.parse({ id });

        const user = await getUserPublicById({
            userId: params.id,
            principal: req.user,
        });

        if (!user) throw apiError(404, 'NOT_FOUND', 'User not found');
        return toUserPublicDTO(user);
    }
}
