import { Controller, Get, Route, Tags, SuccessResponse, Response } from 'tsoa';
import type { ErrorEnvelopeDTO } from '../dto/error.dto';
import type { OkDTO } from '../dto/common.dto';
import type { HealthDTO, StoragePingDTO } from '../dto/health.dto';

import {
    getHealth,
    pingDb,
    pingRedis,
    pingStorage,
} from '../../domain/health/health.service';

@Route('')
@Tags('Health')
export class HealthController extends Controller {
    /**
     * GET /health
     * public health info
     */
    @Get('health')
    @SuccessResponse(200, 'Ok')
    public getHealth(): HealthDTO {
        return getHealth();
    }

    /**
     * GET /db/ping
     * checks DB connectivity
     */
    @Get('db/ping')
    @SuccessResponse(200, 'Ok')
    @Response<ErrorEnvelopeDTO>(500, 'Internal error')
    public async dbPing(): Promise<OkDTO> {
        await pingDb();
        return { status: 'ok' };
    }

    /**
     * GET /storage/ping
     * checks MinIO bucket availability
     */
    @Get('storage/ping')
    @SuccessResponse(200, 'Ok')
    @Response<ErrorEnvelopeDTO>(500, 'Internal error')
    public async storagePing(): Promise<StoragePingDTO> {
        const { bucket, exists } = await pingStorage();
        return { status: 'ok', bucket, exists };
    }

    /**
     * GET /redis/ping
     * checks Redis connectivity
     */
    @Get('redis/ping')
    @SuccessResponse(200, 'Ok')
    @Response<ErrorEnvelopeDTO>(500, 'Internal error')
    public async redisPing(): Promise<OkDTO> {
        await pingRedis();
        return { status: 'ok' };
    }
}
