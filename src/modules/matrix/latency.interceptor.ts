import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Histogram } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LatencyInterceptor implements NestInterceptor {
    constructor(
        @InjectMetric('http_request_duration_seconds')
        private readonly histogram: Histogram<string>,
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();

        const end = this.histogram.startTimer({
            method: request.method,
            route: request.route?.path || request.url,
        });

        return next.handle().pipe(
            tap(() => {
                end({ status: context.switchToHttp().getResponse().statusCode });
            }),
        );
    }
}