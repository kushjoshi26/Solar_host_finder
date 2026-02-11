import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisSQSHelper {
    private redisClient: any;

    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
        // Access underlying redis client
        this.redisClient = (this.cacheManager.stores as any).getClient();
    }
    /**
     * Add Notifications into redis 
     */
    async addNotificationToRedis(
        key: string,
        tenantId: string,
        userId: string,
        notificationData: any
    ): Promise<number> {
        // store data for 24 hours 
        return await this.redisClient.set(
            `notification:${tenantId}-${userId}`,
            JSON.stringify(notificationData),
            'EX',
            60 * 12 * 24,
        );
    }

    /**
     * Remove location (ZREM)
     */
    async removeNotification(key: string): Promise<number> {
        return this.redisClient.del(key);
    }
}