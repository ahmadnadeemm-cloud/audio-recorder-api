import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy } from "passport-google-oauth20";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor() {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackURL = process.env.GOOGLE_CALLBACK_URL;

    console.log(`[GoogleAuth] GOOGLE_CLIENT_ID configured: ${Boolean(clientID)}`);
    console.log(`[GoogleAuth] GOOGLE_CLIENT_SECRET configured: ${Boolean(clientSecret)}`);
    console.log(`[GoogleAuth] GOOGLE_CALLBACK_URL configured: ${Boolean(callbackURL)}`);

    super({
      clientID: clientID ?? "",
      clientSecret: clientSecret ?? "",
      callbackURL: callbackURL ?? "",
      scope: ["email", "profile"],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ) {
    void accessToken;
    void refreshToken;

    const email = profile.emails?.[0]?.value?.trim().toLowerCase();

    if (!email) {
      throw new UnauthorizedException("Google account did not provide an email");
    }

    return { email };
  }
}
