import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Res, Post } from "@nestjs/common";
import { Response } from "express";
@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/get-hello-world')
  @ApiOkResponse({
    description: 'Returns the default application greeting.',
    schema: {
      type: 'string',
      example: 'Hello World!',
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response) {
    // Clear cookie named "token" (you can rename if needed)
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // set true when using https in production
    });

    return { message: "Logged out" };
  }
}
