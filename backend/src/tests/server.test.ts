import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('server.ts', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        vi.resetModules();
    });

    it('starts server: ensureBucket + listen + signal handlers', async () => {
        const ensureBucket = vi.fn().mockResolvedValue(undefined);
        const disconnect = vi.fn().mockResolvedValue(undefined);

        const closeCbHolders: Array<() => void> = [];
        const serverMock = {
            close: vi.fn((cb: any) => {
                closeCbHolders.push(cb);
            }),
        };

        const listenMock = vi.fn((_port: number, cb: any) => {
            cb?.();
            return serverMock as any;
        });

        const appMock = { listen: listenMock };

        const loggerMock = {
            info: vi.fn(),
            error: vi.fn(),
            fatal: vi.fn(),
            warn: vi.fn(),
            debug: vi.fn(),
            trace: vi.fn(),
        };

        const onHandlers = new Map<string, Function>();
        const onSpy = vi
            .spyOn(process, 'on')
            .mockImplementation((event: any, handler: any) => {
                onHandlers.set(String(event), handler);
                return process;
            });

        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((
            code?: number,
        ) => {
            return undefined as never;
        }) as any);

        vi.doMock('../app', () => ({ createApp: () => appMock }));
        vi.doMock('../config/logger', () => ({ logger: loggerMock }));
        vi.doMock('../lib/minio', () => ({ ensureBucket }));
        vi.doMock('../lib/prisma', () => ({
            prisma: { $disconnect: disconnect },
        }));

        vi.resetModules();
        await import('../server');

        expect(ensureBucket).toHaveBeenCalledOnce();
        expect(listenMock).toHaveBeenCalledOnce();
        expect(onSpy).toHaveBeenCalled();
        expect(onHandlers.has('SIGINT')).toBe(true);
        expect(onHandlers.has('SIGTERM')).toBe(true);

        const sigint = onHandlers.get('SIGINT')!;
        sigint();

        expect(serverMock.close).toHaveBeenCalledOnce();
        expect(closeCbHolders.length).toBe(1);

        closeCbHolders[0]();

        await vi.runAllTimersAsync();
        expect(disconnect).toHaveBeenCalledOnce();

        await vi.advanceTimersByTimeAsync(60);
        expect(exitSpy).toHaveBeenCalledWith(0);
    });

    it('start() catch -> fatal + exit(1)', async () => {
        const loggerMock = {
            fatal: vi.fn(),
            info: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
            debug: vi.fn(),
            trace: vi.fn(),
        };

        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((
            code?: number,
        ) => {
            return undefined as never;
        }) as any);

        vi.doMock('../app', () => ({ createApp: () => ({ listen: vi.fn() }) }));
        vi.doMock('../config/logger', () => ({ logger: loggerMock }));
        vi.doMock('../lib/minio', () => ({
            ensureBucket: vi.fn().mockRejectedValue(new Error('minio down')),
        }));
        vi.doMock('../lib/prisma', () => ({
            prisma: { $disconnect: vi.fn() },
        }));

        vi.resetModules();
        await import('../server');

        expect(loggerMock.fatal).toHaveBeenCalled();
        expect(exitSpy).toHaveBeenCalledWith(1);
    });
});
