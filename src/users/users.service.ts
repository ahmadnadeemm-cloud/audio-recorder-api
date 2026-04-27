import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "../auth/user.entity";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private usersRepo: Repository<User>) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  async getMe(userId: number) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    return { id: user.id, email: user.email, createdAt: user.createdAt };
  }

  async updateMe(userId: number, dto: UpdateProfileDto) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    // email update
    const normalizedEmail = dto.email ? this.normalizeEmail(dto.email) : undefined;
    if (normalizedEmail && normalizedEmail !== user.email) {
      const exists = await this.usersRepo.findOne({ where: { email: normalizedEmail } });
      if (exists) throw new BadRequestException("Email already in use");
      user.email = normalizedEmail;
    }

    // password update
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    await this.usersRepo.save(user);

    return { updated: true };
  }
}
