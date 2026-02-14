import { Inject, Injectable } from '@nestjs/common';
// import { CACHE_MANAGER } from '@nestjs/cache-manager';
import Redis from 'ioredis';

@Injectable()
export class RedisGeoHelper {
    // private redisClient: any;

    constructor(@Inject('REDIS_CLIENT') private redisClient: Redis) {}

    /**
     * Add or Update Location (Set)
     */
    async addOrUpdateTenantLocation(
        key: string,
        longitude: string,
        latitude: string,
    ): Promise<string> {
        const data = {
            longitude, 
            latitude
        }
        return await this.redisClient.set(
            key,
            JSON.stringify(data),
            'EX',
            300,
        );
    }

    /**
   * Add or Update Location (GEOADD)
   */
    async addOrUpdateUserLocation(
        key: string,
        longitude: string,
        latitude: string,
        userId: string
    ): Promise<number> {
        return this.redisClient.geoadd(key, longitude, latitude, userId);
    }

    /**
     * Remove location (ZREM)
     */
    async removeLocation(key: string, member: string): Promise<number> {
        return this.redisClient.zrem(key, member);
    }

    /**
     * Get Nearby members
     */
    async getNearby(
        key: string,
        longitude: string,
        latitude: string,
        radius: number,
        unit: 'm' | 'km' = 'km',
    ) {
        return this.redisClient.geosearch(
            key,
            'FROMLONLAT',
            longitude,
            latitude,
            'BYRADIUS',
            radius,
            unit,
            'WITHDIST',
        );
    }

    /**
     * Get specific member position
     */
    async getTenantLocation(key: string) {
        return this.redisClient.get(key);
    }

}