import { Controller, Get, Patch, Body, UseGuards, Req } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { UsersService } from "./users.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private users: UsersService) {}

  @Get("me")
  getMe(@Req() req: any) {
    return this.users.getMe(req.user.userId);
  }

  @Patch("me")
  updateMe(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.users.updateMe(req.user.userId, dto);
  }
}