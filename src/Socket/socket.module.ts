import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { RedisModule } from '../modules/redis/redis.module';

@Module({
    imports: [RedisModule],
    providers: [SocketGateway],
    exports: [SocketGateway],
})
export class SocketModule { }