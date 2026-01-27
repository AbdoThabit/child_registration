import {
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsInt
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateNewParentDto {
    // @IsString()
    // @IsOptional()
    // parentId: string;
    @IsString()
    @ApiProperty()
    @IsOptional()
    primaryMobile: string;
    @IsString()
    @ApiProperty()
    @IsOptional()
    primaryLandline: string;
    @IsString()
    @ApiProperty()
    @IsOptional()
    emergencyMobile: string;
    @IsString()
    @ApiProperty()
    @IsOptional()
    emergencyLandline: string;
    @IsString()
    @ApiProperty()
    parentName: string;
    @IsString()
    @ApiProperty()
    pin: string;
    @IsString()
    @ApiProperty()
    @IsOptional()
    spouseName: string;
    @IsString()
    @ApiProperty()
    @IsOptional()
    primaryContact: string;
    @IsString()
    @ApiProperty()
    @IsOptional()
    emergencyContact: string;
    @IsString()
    @ApiProperty()
    @IsOptional()
    primaryAddress: string;
    @IsString()
    @ApiProperty()
    @IsOptional()
    @IsEmail()
    email: string;
    @IsNumber()
    @ApiProperty()
    @IsOptional()
    parentTitle?: number;
    @IsNumber()
    @ApiProperty()
    @IsOptional()
    prospectId?: number;
    @IsString()
    @ApiProperty()
    @IsOptional()
    parentProfession: string;
    @IsString()
    @ApiProperty()
    @IsOptional()
    spouseProfession: string;
    @IsString()
    @ApiProperty()
    @IsOptional()
    registrationId: string;
    @IsString()
    @ApiProperty()
    @IsOptional()
    spouseEmail: string;
}