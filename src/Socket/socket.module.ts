import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { RedisModule } from '../modules/redis/redis.module';
import { JwtModule } from '@nestjs/jwt'; 
import { ConfigModule } from '../modules/config/config.module'; // ✅ Import ConfigModule
import { ConfigService } from '../modules/config/config.service';
import { SocketAuthGuard } from './socket-auth.guard';
@Module({
    imports: [RedisModule, 
        JwtModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
            secret: configService.get('WEBTOKEN_SECRET_KEY'),
            signOptions: {
                expiresIn: Number(configService.get('WEBTOKEN_EXPIRATION_TIME')) || 1800,
            },
        }),
    }),
    ],
    providers: [SocketGateway, SocketAuthGuard],
    exports: [SocketGateway],
})
export class SocketModule { }