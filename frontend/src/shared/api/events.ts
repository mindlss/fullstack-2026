import type { ApiError } from './http';

type ApiErrorListener = (err: ApiError) => void;

const listeners = new Set<ApiErrorListener>();

export function onApiError(listener: ApiErrorListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function emitApiError(err: ApiError): void {
    for (const l of listeners) l(err);
}
