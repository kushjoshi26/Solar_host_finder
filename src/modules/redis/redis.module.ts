import Redis from 'ioredis';
import { Module, Global } from '@nestjs/common';
import { RedisGeoHelper } from './redis-geo.helper';
import { RedisSQSHelper } from './redis-sqs-helper';

@Global()
@Module({
    providers: [RedisGeoHelper, 
        RedisSQSHelper,
        {
        provide: 'REDIS_CLIENT',
        useFactory: async () => {
            const client = new Redis({
                host: process.env.REDIS_HOST || 'localhost',
                port: Number(process.env.REDIS_PORT) || 6379,
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
                maxRetriesPerRequest: 3,
                enableReadyCheck: true,
                lazyConnect: false, 
            });

            client.on('connect', () => {
                console.log('✅ Redis connected');
            });
            client.on('ready', () => {
                console.log('✅ Redis connected');
            });

            client.on('error', (err) => {
                console.error('❌ Redis error:', err);
            });

            return client;
        },
    },],
    exports: [RedisGeoHelper,  RedisSQSHelper, 'REDIS_CLIENT'],
})
export class RedisModule { }
