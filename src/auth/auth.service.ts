import { Injectable, BadRequestException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { User } from "./user.entity";
import { SignupDto } from "./dto/signup.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
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
    const normalizedEmail = this.normalizeEmail(email);
    let user = await this.usersRepo.findOne({ where: { email: normalizedEmail } });

    if (!user) {
      user = await this.usersRepo.save({
        email: normalizedEmail,
        passwordHash: null,
      });
    }

    return user;
  }

  async issueTokenForUser(user: User) {
    const access_token = await this.jwt.signAsync({ sub: user.id });
    return { access_token };
  }

  async loginWithGoogleEmail(email: string) {
    const user = await this.findOrCreateGoogleUser(email);
    return this.issueTokenForUser(user);
  }

  async login(dto: LoginDto) {
    const email = this.normalizeEmail(dto.email);
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException("Invalid email or password");

    const ok = await this.isPasswordValid(dto.password, user);
    if (!ok) throw new UnauthorizedException("Invalid email or password");

    return this.issueTokenForUser(user);
  }

  private async isPasswordValid(password: string, user: User) {
    if (!user.passwordHash) {
      return false;
    }

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
