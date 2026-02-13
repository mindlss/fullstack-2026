import type { ErrorEnvelopeDTO } from './types';

export class ApiError extends Error {
    readonly status: number;
    readonly code?: string;
    readonly requestId?: string;
    readonly details?: unknown;

    constructor(
        message: string,
        init: {
            status: number;
            code?: string;
            requestId?: string;
            details?: unknown;
        },
    ) {
        super(message);
        this.name = 'ApiError';
        this.status = init.status;
        this.code = init.code;
        this.requestId = init.requestId;
        this.details = init.details;
    }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestOptions = {
    method: HttpMethod;
    path: string;
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
    signal?: AbortSignal;
    headers?: Record<string, string>;
};

const BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '';

function buildUrl(path: string, query?: RequestOptions['query']): string {
    if (BASE_URL) {
        const url = new URL(path, BASE_URL);
        if (query) {
            for (const [k, v] of Object.entries(query)) {
                if (v === undefined) continue;
                url.searchParams.set(k, String(v));
            }
        }
        return url.toString();
    }

    const url = new URL(path, window.location.origin);
    if (query) {
        for (const [k, v] of Object.entries(query)) {
            if (v === undefined) continue;
            url.searchParams.set(k, String(v));
        }
    }
    return url.pathname + url.search;
}

function isErrorEnvelope(value: unknown): value is ErrorEnvelopeDTO {
    if (typeof value !== 'object' || value === null) return false;
    if (!('error' in value)) return false;

    const err = (value as { error?: unknown }).error;
    if (typeof err !== 'object' || err === null) return false;

    return 'code' in err;
}

async function readBody(res: Response): Promise<unknown> {
    const contentType = res.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');

    if (isJson) return (await res.json()) as unknown;

    const text = await res.text();
    try {
        return JSON.parse(text) as unknown;
    } catch {
        return text;
    }
}

async function doFetch(opts: RequestOptions): Promise<Response> {
    const headers: Record<string, string> = { ...(opts.headers ?? {}) };
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

    return fetch(buildUrl(opts.path, opts.query), {
        method: opts.method,
        credentials: 'include',
        cache: 'no-store',
        headers,
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
        signal: opts.signal,
    });
}

// ---- Refresh interceptor ----

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
    if (refreshInFlight) return refreshInFlight;

    refreshInFlight = (async () => {
        const res = await doFetch({ method: 'POST', path: '/auth/refresh' });
        return res.ok;
    })();

    try {
        return await refreshInFlight;
    } finally {
        refreshInFlight = null;
    }
}

function isAuthPath(path: string): boolean {
    return (
        path.startsWith('/auth/login') ||
        path.startsWith('/auth/register') ||
        path.startsWith('/auth/refresh') ||
        path.startsWith('/auth/logout')
    );
}

export async function http<T>(opts: RequestOptions): Promise<T> {
    let res = await doFetch(opts);

    if (res.status === 401 && !isAuthPath(opts.path)) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            res = await doFetch(opts);
        }
    }

    if (res.status === 204) return undefined as T;

    const data = await readBody(res);

    if (!res.ok) {
        if (isErrorEnvelope(data)) {
            throw new ApiError(data.error.message ?? `HTTP ${res.status}`, {
                status: res.status,
                code: data.error.code,
                requestId: data.error.requestId,
                details: data.error.details,
            });
        }
        throw new ApiError(`HTTP ${res.status}`, { status: res.status });
    }

    return data as T;
}
