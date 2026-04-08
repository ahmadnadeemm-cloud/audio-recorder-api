import { ApiProperty } from "@nestjs/swagger";

export class CreateRecordingDto {
  @ApiProperty({ example: "Meeting audio" })
  title: string;
}