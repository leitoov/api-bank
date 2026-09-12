import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo global para todos los endpoints
  app.setGlobalPrefix('api');

  // Habilitar CORS
  app.enableCors();

  // Validación global con class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Interceptor global para estandarizar respuestas de exito (200, 201)
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Filtro global para estandarizar respuestas de error (400, 401, 404, 409, 500)
  app.useGlobalFilters(new HttpExceptionFilter());

  // Configuración de Swagger / OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Bank API')
    .setDescription('API Bancaria para gestión de usuarios, cuentas, transferencias y autenticación.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Banco API corriendo en: http://localhost:${port}/api`);
  console.log(`Documentacion Swagger en: http://localhost:${port}/api/docs`);
}
await bootstrap();
