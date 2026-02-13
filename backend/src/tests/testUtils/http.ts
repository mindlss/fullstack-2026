import type { Request, Response } from 'express';

type JsonBody = any;

export function makeReq(partial?: Partial<Request>): Request {
    const base: any = {
        path: '/x',
        method: 'GET',
        headers: {} as Record<string, any>,
        socket: {} as any,
        header(name: string) {
            const key = name.toLowerCase();
            return (this.headers as any)?.[key];
        },
    };

    return { ...base, ...(partial as any) } as Request;
}

export function makeRes() {
    const headers: Record<string, string> = {};
    let statusCode = 200;
    let jsonBody: JsonBody | undefined;

    const res: any = {
        status(code: number) {
            statusCode = code;
            return res;
        },
        json(body: any) {
            jsonBody = body;
            return res;
        },
        setHeader(name: string, value: string | number | readonly string[]) {
            headers[String(name).toLowerCase()] = Array.isArray(value)
                ? value.join(', ')
                : String(value);
            return res;
        },
    };

    return {
        res: res as Response,
        get statusCode() {
            return statusCode;
        },
        get jsonBody() {
            return jsonBody;
        },
        get headers() {
            return headers;
        },
    };
}
