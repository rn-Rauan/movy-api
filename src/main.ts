import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './shared/exceptions/all-exceptions.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import { ValidationPipe } from '@nestjs/common';
import "dotenv/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());
  
  // Global Interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());
  
  // Global Validation Pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  if(!process.env.PORT){
    throw new Error('PORT invalid')
  }
  await app.listen(process.env.PORT);
}
bootstrap();
