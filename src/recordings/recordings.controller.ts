import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RecordingsService } from "./recordings.service";
import { CreateRecordingDto } from "./dto/create-recording.dto";
import { UpdateRecordingDto } from "./dto/update-recording.dto";

@ApiTags("recordings")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("recordings")
export class RecordingsController {
  constructor(private readonly service: RecordingsService) {}

  // CREATE (Upload audio)
  @Post()
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        title: { type: "string", example: "My recording" },
        audio: { type: "string", format: "binary" }, // <-- makes Swagger show Choose File
      },
      required: ["audio"],
    },
  })
  @UseInterceptors(FileInterceptor("audio"))
  create(
    @Req() req: any,
    @Body() dto: CreateRecordingDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.service.create(req.user.userId, dto, file);
  }

  // READ ALL (for current user)
  @Get()
  findAll(@Req() req: any) {
    return this.service.findAllForUser(req.user.userId);
  }

  // READ ONE (for current user)
  @Get(":id")
  findOne(@Req() req: any, @Param("id") id: string) {
    return this.service.findOne(req.user.userId, Number(id));
  }

  // UPDATE (title and/or replace audio)
  @Patch(":id")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        title: { type: "string", example: "Updated title" },
        audio: { type: "string", format: "binary" }, // optional file replacement
      },
    },
  })
  @UseInterceptors(FileInterceptor("audio"))
  update(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateRecordingDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    return this.service.update(req.user.userId, Number(id), dto, file);
  }

  // DELETE
  @Delete(":id")
    remove(@Req() req: any, @Param("id") id: string) {
    return this.service.remove(req.user.userId, Number(id));
    }
}