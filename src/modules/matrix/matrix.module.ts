import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { LatencyInterceptor } from './latency.interceptor';
import { metricsProviders } from './metrics.providers';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
    }),
  ],
  providers: [
    ...metricsProviders,
    {
      provide: APP_INTERCEPTOR,
      useClass: LatencyInterceptor,
    },
  ],
})
export class MetricsModule { }