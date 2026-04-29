import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { RecordingsModule } from "./recordings/recordings.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>("DATABASE_URL");

        // ✅ DEBUG (temporary) — check if Railway is providing DATABASE_URL
        console.log("DATABASE_URL present?", !!databaseUrl);

        // ✅ Railway / Cloud
        if (databaseUrl) {
          return {
            type: "postgres",
            url: databaseUrl,
            autoLoadEntities: true,
            synchronize: true, // OK for now
            ssl: { rejectUnauthorized: false }, // Railway often needs SSL
          };
        }

        // ✅ Local
        return {
          type: "postgres",
          host: config.get("DB_HOST"),
          port: Number(config.get("DB_PORT")),
          username: config.get("DB_USER"),
          password: config.get("DB_PASS"),
          database: config.get("DB_NAME"),
          autoLoadEntities: true,
          synchronize: true, // dev only
        };
      },
    }),

    AuthModule,
    RecordingsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}