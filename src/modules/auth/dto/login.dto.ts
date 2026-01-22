import { IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'The username field is required.' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'The password field is required.' })
  password: string;
}