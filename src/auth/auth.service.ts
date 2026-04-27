import { Injectable, BadRequestException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { OAuth2Client } from "google-auth-library";
import { User } from "./user.entity";
import { SignupDto } from "./dto/signup.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  private readonly googleClientId = process.env.GOOGLE_CLIENT_ID;
  private readonly googleClient = new OAuth2Client(this.googleClientId);

  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private jwt: JwtService
  ) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  async signup(dto: SignupDto) {
    const email = this.normalizeEmail(dto.email);
    const existing = await this.usersRepo.findOne({ where: { email } });
    if (existing) throw new BadRequestException("Email already exists");

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersRepo.save({ email, passwordHash });

    return { id: user.id, email: user.email, createdAt: user.createdAt };
  }

  async findOrCreateGoogleUser(email: string) {
    let user = await this.usersRepo.findOne({ where: { email } });

    if (!user) {
      user = await this.usersRepo.save({
        email,
        passwordHash: "GOOGLE_SSO",
      });
    }

    return user;
  }

  async loginWithGoogle(idToken: string) {
    const googleUser = await this.verifyGoogleIdToken(idToken);
    const user = await this.findOrCreateGoogleUser(googleUser.email);
    const access_token = await this.jwt.signAsync({ sub: user.id });

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: googleUser.name,
        picture: googleUser.picture,
      },
    };
  }

  async login(dto: LoginDto) {
    const email = this.normalizeEmail(dto.email);
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException("Invalid email or password");

    const ok = await this.isPasswordValid(dto.password, user);
    if (!ok) throw new UnauthorizedException("Invalid email or password");

    const access_token = await this.jwt.signAsync({ sub: user.id });
    return { access_token };
  }

  private async verifyGoogleIdToken(idToken: string) {
    if (!this.googleClientId) {
      throw new UnauthorizedException("GOOGLE_CLIENT_ID is not configured");
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: this.googleClientId,
    });

    const payload = ticket.getPayload();
    const email = payload?.email ? this.normalizeEmail(payload.email) : null;

    if (!payload || !email) {
      throw new UnauthorizedException("Invalid Google token");
    }

    if (!payload.email_verified) {
      throw new UnauthorizedException("Google email is not verified");
    }

    return {
      email,
      name: payload.name ?? "",
      picture: payload.picture ?? "",
    };
  }

  private async isPasswordValid(password: string, user: User) {
    if (await bcrypt.compare(password, user.passwordHash)) {
      return true;
    }

    // Support legacy rows that may still store plaintext passwords.
    if (user.passwordHash === password) {
      user.passwordHash = await bcrypt.hash(password, 10);
      await this.usersRepo.save(user);
      return true;
    }

    return false;
  }
}
