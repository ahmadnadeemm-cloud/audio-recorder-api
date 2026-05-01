import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.setGlobalPrefix("api");
  const port = Number(process.env.PORT ?? 3002);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (origin === "http://localhost:3001") {
        return callback(null, true);
      }

      try {
        const { hostname, protocol } = new URL(origin);

        if (
          protocol === "https:" &&
          hostname.endsWith(".vercel.app") &&
          hostname.includes("ahmadnadeemm-clouds-projects")
        ) {
          // Update the substring above if the Vercel project/account naming changes.
          return callback(null, true);
        }
      } catch {
        return callback(new Error("CORS origin is not a valid URL"), false);
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
