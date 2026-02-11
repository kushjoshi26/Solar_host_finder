import { makeHistogramProvider } from '@willsoto/nestjs-prometheus';

export const metricsProviders = [
    makeHistogramProvider({
        name: 'http_request_duration_seconds',
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'route', 'status'],
        buckets: [0.05, 0.1, 0.2, 0.3, 0.5, 1, 2],
    }),
];