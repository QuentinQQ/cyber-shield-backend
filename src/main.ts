import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as express from 'express';
import * as session from 'express-session';
import { RedisStore } from "connect-redis"
import Redis from 'ioredis';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Redis connection and setup
  const redisClient = new Redis("rediss://default:AXLDAAIjcDEwYzRiZTJkMWVlNjE0MDQ1YjZhMGE4OGIxNWEwMWM2N3AxMA@pleased-sloth-29379.upstash.io:6379");
  // Redis connection event listeners
  redisClient.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });

  redisClient.on('ready', () => {
    console.log('✅ Redis is ready to receive commands');
  });

  redisClient.on('error', (err) => {
    console.error('❌ Redis connection error:', err.message);
  });

  redisClient.on('close', () => {
    console.log('⚠️ Redis connection closed');
  });
  // Initialize store.
  const redisStore = new RedisStore({
    client: redisClient,
    prefix: "feedgame:sess:",
  })


  app.use(helmet());
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Initialize session storage - MOVE: Put this after helmet but before CORS
  app.use(
    session({
      store: redisStore,
      resave: false, // required: force lightweight session keep alive (touch)
      saveUninitialized: false, // recommended: only save session when data exists
      secret: process.env.SESSION_SECRET || "keyboard cat",
      name: 'fgid',
      cookie: {
        maxAge: 1000 * 60 * 30, // 30 minutes expiry
        httpOnly: true, // Security
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'lax', // CSRF protection
      },
      rolling: true, // Reset expiry on each request
    }),
  );

  app.enableCors({
    origin: '*',
    credentials: true,
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
