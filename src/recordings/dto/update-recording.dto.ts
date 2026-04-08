import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateRecordingDto {
  @ApiPropertyOptional({ example: "Updated title" })
  title?: string;
}