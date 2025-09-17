import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = process.env.PORT || 3000;
  app.enableCors({
  origin: [
    "http://localhost:5173", 
    "https://school-payments-frontend-qidx.onrender.com"
  ],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: "Content-Type, Authorization",
  credentials: true,
});

  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
 
}
bootstrap();
