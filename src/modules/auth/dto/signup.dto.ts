import { IsString, IsNumber, IsBoolean, IsOptional, MinLength, IsEmail } from 'class-validator';

export class SignUpDto  {
@IsString({ message: 'Username must be at least 4 characters long' })
  username: string;

  @IsString({ message: 'email should be like user@example.com' })
  @IsEmail()
  @IsOptional()
  email: string;

  @IsNumber()
  @IsOptional()
  centerId: number;

  @IsNumber()
  @IsOptional()
  centerType: number;

  @IsString()
  @MinLength(4, { message: 'Password must be at least 4 characters long' })
  password: string;

  @IsBoolean()
  @IsOptional()
  isAdmin?: boolean;

  @IsString()
  @IsOptional()
  firstName?:string;
  
   @IsString()
  @IsOptional()
  lastName?:string;

  @IsBoolean()
  @IsOptional()
  hasAllClassesAccess?: boolean;
}