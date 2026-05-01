import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { SignupDto } from "./dto/signup.dto";
import { LoginDto } from "./dto/login.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  // ✅ Normal signup
  @Post("signup")
  signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto);
  }

  // ✅ Normal login (sets cookie + returns token)
  @Post("login")
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto);

    res.cookie("token", result.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // set true in https production
      maxAge: 24 * 60 * 60 * 1000,
    });

    return result;
  }

  @Get("google")
  @UseGuards(AuthGuard("google"))
  googleLogin() {
    console.log("[GoogleAuth] Starting Google OAuth flow");
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleCallback(@Req() req: { user?: { email?: string } }, @Res() res: Response) {
    const email = req.user?.email;
    console.log(`[GoogleAuth] Callback received. Email present: ${Boolean(email)}`);

    if (!email) {
      const frontendUrl = this.normalizeFrontendUrl(process.env.FRONTEND_URL);
      return res.redirect(`${frontendUrl}/login?error=google_email_missing`);
    }

    const result = await this.auth.loginWithGoogleEmail(email);
    const frontendUrl = this.normalizeFrontendUrl(process.env.FRONTEND_URL);

    return res.redirect(`${frontendUrl}/auth/callback?token=${encodeURIComponent(result.access_token)}`);
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("token", { httpOnly: true, sameSite: "lax", secure: false });
    return { message: "Logged out" };
  }

  private normalizeFrontendUrl(frontendUrl?: string) {
    return (frontendUrl?.trim().replace(/\/+$/, "") || "http://localhost:3000");
  }
}
