import { ApiProperty } from "@nestjs/swagger";

export class GoogleLoginDto {
  @ApiProperty({
    example: "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...google-id-token",
    description: "Google ID token returned by Google Identity Services on the frontend",
  })
  idToken: string;
}
