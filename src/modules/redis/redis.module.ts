import Redis from 'ioredis';
import { Module, Global } from '@nestjs/common';
import { RedisGeoHelper } from './redis-geo.helper';

@Global()
@Module({
    providers: [RedisGeoHelper, 
        {
        provide: 'REDIS_CLIENT',
        useFactory: async () => {
            const client = new Redis({
                host: process.env.REDIS_HOST || 'localhost',
                port: Number(process.env.REDIS_PORT) || 6379,
            });

            client.on('connect', () => {
                console.log('✅ Redis connected');
            });

            client.on('error', (err) => {
                console.error('❌ Redis error:', err);
            });

            return client;
        },
    },],
    exports: [RedisGeoHelper, 'REDIS_CLIENT'],
})
export class RedisModule { }
