import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './shared/presentation/exceptions/all-exceptions.filter';
import { LoggingInterceptor } from './shared/presentation/interceptors/logging.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'dotenv/config';
// ✅ Load JWT Payload type declarations globally
import 'src/shared/infrastructure/types/jwt-payload.interface';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global Interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Movy API')
    .setDescription('The Movy API documentation')
    .setVersion('1.0')
    .addTag('users')
    .addTag('organizations')
    .addTag('auth')
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  if (!process.env.PORT) {
    throw new Error('PORT invalid');
  }
  await app.listen(process.env.PORT, '0.0.0.0');
}
void bootstrap();
