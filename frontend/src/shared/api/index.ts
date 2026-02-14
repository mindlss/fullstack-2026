export * from './types';
export * from './http';
export { authApi } from './auth.api';
export { usersApi } from './users.api';
export { healthApi } from './health.api';

import { ApiError, API_ERROR_CODES } from './http';

export function isApiError(err: unknown): err is ApiError {
    return err instanceof ApiError;
}

export function isTooManyRequests(err: unknown): err is ApiError {
    return (
        err instanceof ApiError &&
        (err.status === 429 || err.code === API_ERROR_CODES.TOO_MANY_REQUESTS)
    );
}
