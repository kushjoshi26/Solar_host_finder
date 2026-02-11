import { NestFactory } from "@nestjs/core";
import { rateLimit } from 'express-rate-limit';
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./modules/app/app.module";
import { LatencyInterceptor } from "./modules/matrix/latency.interceptor";

(async () => {
  const app = await NestFactory.create(AppModule, {
    logger: console,
  });

  app.use(
    rateLimit({
      windowMs: 60, // 1 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    }),
  );
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(9000, "0.0.0.0");
})();
