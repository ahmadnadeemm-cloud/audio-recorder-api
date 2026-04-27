import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: { cookies?: Record<string, string> }) => request?.cookies?.token ?? null,
      ]),
      secretOrKey: process.env.JWT_SECRET || "DEV_SECRET_CHANGE_ME",
    });
  }

  validate(payload: any) {
    // payload contains only: { sub: userId }
    return { userId: payload.sub };
  }
}
