import Redis from "ioredis";
import * as winston from "winston";
import * as rotateFile from "winston-daily-rotate-file";
import { Module } from "@nestjs/common";
import * as redisStore from 'cache-manager-redis-store';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "../config/config.module";
import { ConfigService } from "../config/config.service";
import { AuthModule } from "../auth/auth.module";
import { UserModule } from "../user/user.module";
import { WinstonModule } from "../winston/winston.module";
// import { AccessControlModule } from "nest-access-control";
import { SocketModule } from "Socket/socket.module";
import { RedisModule } from '../redis/redis.module';
import { ThrottlerModule } from "@nestjs/throttler";
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { RedisSQSHelper } from "modules/redis/redis-sqs-helper";


@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: ['REDIS_CLIENT'],
      useFactory: (redis: Redis) => ({
        storage: new ThrottlerStorageRedisService(redis),
        throttlers: [
          {
            ttl: 60,
            limit: 20,
          },
        ],
      }),
    }),
    CacheModule.registerAsync({
      isGlobal: true, 
      inject: [ 'REDIS_CLIENT' ],
      useFactory: async (redis: Redis) => ({
        store: redisStore as any,
        redisInstance: redis,
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get("DB_URL"),
      }),
    }),
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return configService.isEnv("dev")
          ? {
            level: "info",
            format: winston.format.json(),
            defaultMeta: { service: "user-service" },
            transports: [
              new winston.transports.Console({
                format: winston.format.simple(),
              }),
            ],
          }
          : {
            level: "info",
            format: winston.format.json(),
            defaultMeta: { service: "user-service" },
            transports: [
              new winston.transports.File({
                filename: "logs/error.log",
                level: "error",
              }),
              new winston.transports.Console({
                format: winston.format.simple(),
              }),
              new rotateFile({
                filename: "logs/application-%DATE%.log",
                datePattern: "YYYY-MM-DD",
                zippedArchive: true,
                maxSize: "20m",
                maxFiles: "14d",
              }),
            ],
          };
      },
    }),
    
    SocketModule,
    // AccessControlModule.forRoles(roles),
    ConfigModule,
    AuthModule,
    UserModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
