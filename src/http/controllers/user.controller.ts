import { Controller, Get, Path, Request, Route, Security, Tags } from 'tsoa';
import type { Request as ExpressRequest } from 'express';

import { apiError } from '../errors/ApiError';
import { ensureViewer, requireCurrentUser } from '../tsoa/context';

import { userIdParamsSchema } from '../schemas/user.schemas';

import {
    getUserPublicById,
    getUserSelf,
} from '../../domain/users/user.service';

import { toUserPublicDTO, toUserSelfDTO } from '../dto/user.dto';

import type { UserPublicDTO, UserSelfDTO } from '../dto/user.dto';

@Route('users')
@Tags('Users')
export class UsersController extends Controller {
    /**
     * GET /users/me
     * auth required
     */
    @Get('me')
    @Security('cookieAuth')
    public async getMe(@Request() req: ExpressRequest): Promise<UserSelfDTO> {
        await requireCurrentUser(req);

        const user = await getUserSelf(req.currentUser!.id);
        if (!user) throw apiError(401, 'UNAUTHORIZED', 'User not found');

        return toUserSelfDTO(user);
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
        await ensureViewer(req);

        const params = userIdParamsSchema.parse({ id });

        const user = await getUserPublicById({
            userId: params.id,
            viewer: req.viewer,
        });
        if (!user) throw apiError(404, 'NOT_FOUND', 'User not found');

        return toUserPublicDTO(user);
    }
}
