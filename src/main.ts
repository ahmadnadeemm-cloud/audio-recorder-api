import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.setGlobalPrefix("api");
  const port = Number(process.env.PORT ?? 3002);
  const frontendUrl = (process.env.FRONTEND_URL ?? "http://localhost:3000")
    .trim()
    .replace(/\/+$/, "");
  const allowedOrigins = new Set([frontendUrl, "http://localhost:3001"]);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed"), false);
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
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
