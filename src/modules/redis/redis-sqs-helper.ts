import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisSQSHelper {
    private readonly MAIN_QUEUE = 'meeting:notifications';
    constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: Redis, // ✅ Direct injection
    ) { }
    /**
     * Add Notifications into redis 
     */
    async addNotificationToRedis(
        mongoId: string,
        tenantId: string,
        userId: string,
        notificationData: any
    ): Promise<number> {
        // store data for 24 hours 

        const message = {
            id: mongoId,
            tenantId,
            userId,
            data: notificationData,
            attemptCount: 0,
        };
       return await this.redisClient.rpush(this.MAIN_QUEUE, JSON.stringify(message));
    }

    /**
     * Remove whole notification array 
     */
    async removeNotification(key: string): Promise<number> {
        return this.redisClient.del(key);
    }
}