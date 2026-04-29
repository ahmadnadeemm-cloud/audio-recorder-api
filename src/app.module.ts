import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
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
        const databaseUrl =
          process.env.DATABASE_URL ?? config.get<string>("DATABASE_URL");
        const nodeEnv = process.env.NODE_ENV ?? config.get<string>("NODE_ENV");
        const isRailway = Boolean(process.env.RAILWAY_ENVIRONMENT);
        const isProduction = nodeEnv === "production" || isRailway;

        console.log(`[DB] DATABASE_URL present: ${Boolean(databaseUrl)}`);
        console.log(`[DB] config mode: ${isProduction ? "railway" : "local"}`);

        if (isProduction && !databaseUrl) {
          throw new Error("DATABASE_URL missing on Railway production runtime");
        }

        if (databaseUrl) {
          const railwayConfig: TypeOrmModuleOptions = {
            type: "postgres",
            url: databaseUrl,
            autoLoadEntities: true,
            synchronize: true,
            ssl: isProduction ? { rejectUnauthorized: false } : false,
            extra: {
              connectionTimeoutMillis: 10000,
            },
            retryAttempts: 5,
            retryDelay: 3000,
          };

          return railwayConfig;
        }

        const localConfig: TypeOrmModuleOptions = {
          type: "postgres",
          host: process.env.DB_HOST ?? config.get("DB_HOST"),
          port: Number(process.env.DB_PORT ?? config.get("DB_PORT")),
          username: process.env.DB_USER ?? config.get("DB_USER"),
          password: process.env.DB_PASS ?? config.get("DB_PASS"),
          database: process.env.DB_NAME ?? config.get("DB_NAME"),
          autoLoadEntities: true,
          synchronize: true,
          retryAttempts: 3,
          retryDelay: 2000,
        };

        return localConfig;
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
