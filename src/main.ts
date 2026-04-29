import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.setGlobalPrefix("api");
  const port = Number(process.env.PORT ?? 3002);

  // ✅ Allow Next.js frontend to call this backend
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3000', 'https://audio-recorder-web.vercel.app/'],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Audio Recorder API')
    .setDescription('API documentation for the audio recorder service')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  console.log(`Audio Recorder API running at http://localhost:${port}/api`);
}
bootstrap();
