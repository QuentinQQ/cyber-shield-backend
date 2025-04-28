import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOriginsDev = ['*'];

  // const allowedOriginsProd = [
  //   'https://cyber-shield-frontend.pages.dev',
  //   'https://worldwecreated.org',
  // ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOriginsDev.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Api-Key'],
    credentials: false,
  });

  app.useGlobalPipes(new ValidationPipe());

  // Swagger configuration setup
  const config = new DocumentBuilder()
    .setTitle('Cyber Shield API')
    .setDescription('API documentation for Cyberbullying Game Backend')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
  console.log(`🚀 Application is running on: http://localhost:3000`);
  console.log(`📘 Swagger UI available at: http://localhost:3000/api`);
}
bootstrap();
