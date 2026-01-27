
import {
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  MaxLength,
  IsInt,
  IsDate
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { Gender } from 'src/common/enums/Gender';
import { Optional } from '@nestjs/common';
import { toBoolean } from 'src/common/transformers/to-boolean';
export class FillingChildDataDto {
  @ApiProperty({
    description: 'Child Registration ID',
    example: '1',
    required: true,
  })
  @Expose()
  @Type(() => Number)
  @ApiProperty({ example: 1, enum: Gender })
  id: number;


  @ApiProperty({
    description: 'Child date of birth',
    example: '2020-05-15',
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsDate()
  @Transform(({ value }) => { const dateValue = value ? new Date(value) : null;
    console.log(`[childDob] transformed →`, dateValue);
  return dateValue;
  })
  childDob?: Date;
 
  @ApiProperty({
    description: 'class ID',
    example: '1025',
  })


  @ApiProperty({
    description: 'Child gender (0: Female, 1: Male, 2: Other)',
    example: 1,
    required: false,
  })
  @Expose()
  @Type(() => Number)
  @IsInt()
  @IsEnum(Gender)
  @ApiProperty({ example: 1, enum: Gender })
  gender: number;

  @ApiProperty({
    description: 'Child full name',
    example: 'Ahmed Mohamed',
  })
  @Expose()
  @IsString()
  childName: string;

  @ApiProperty({
    description: 'Special needs description',
    example: 'Requires wheelchair access',
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString()
  specialNeeds?: string;





  @ApiProperty({
    description: 'Can take photo permission',
    example: true,
  })
  @Expose()
  @IsOptional()
  @Transform(({ value }) => value ? toBoolean(value) : null)
  @IsBoolean()
  canTakePhoto: boolean;

  @ApiProperty({
    description: 'Child PIN for authentication',
    example: '1234',
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString()
  childPin: string;

  @ApiProperty({
    description: 'Child nationality',
    example: 'Egyptian',
    maxLength: 250,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString()
  @MaxLength(250)
  nationality?: string;
 @ApiProperty({
    description: 'child notes',
    example: 'very smart kid',
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString()

  childNotes?: string;
  @ApiProperty({
    description: 'National ID number',
    example: '12345678901234',
    maxLength: 250,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString()
  @MaxLength(250)
  nationalityId?: string;



  @ApiProperty({
    description: 'Place of birth',
    example: 'Cairo, Egypt',
    maxLength: 250,
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString()
  @MaxLength(250)
  placeOfBirth: string;


  constructor(partial?: Partial<FillingChildDataDto>) {
    if (partial) {
      // 1. Assign basic string/number fields directly
      Object.assign(this, partial);

      // 2. Handle Date conversion manually for form-data strings
      if (partial.childDob) {
        this.childDob = new Date(partial.childDob);
      }

      // 3. Handle Boolean conversion for form-data strings ("true" -> true)
      if (partial.canTakePhoto !== undefined) {
        this.canTakePhoto = toBoolean(partial.canTakePhoto);
      }

      // 4. Ensure numbers are numbers (form-data sends them as strings)
      if (partial.id) this.id = Number(partial.id);
      if (partial.gender) this.gender = Number(partial.gender);
    }
  }


    // @ApiProperty({
  //   description: 'Registration date',
  //   example: '2024-01-10',
  //   required: false,
  // })
  // @Expose()
  // @IsOptional()
  // @IsDate()
  // @Transform(({ value }) => { const dateValue = value ? new Date(value) : null;
  // return dateValue;
  // })
  // registrationDate?: Date;

   //  @ApiProperty({
  //   description: 'Subscription end date',
  //   example: '2025-12-31',
  //   required: false,
  // })
  // @Expose()
  // @IsOptional()
  // @IsDate()
  // @Transform(({ value }) => { const dateValue = value ? new Date(value) : null;
  // return dateValue;
  // })
  // subscriptionEnd?: Date;
  // @ApiProperty({
  //   description: 'Parent ID',
  //   example: '1025',
  // })
  // @Expose()
  // @Type(() => Number)
  // @IsInt()
  // @ApiProperty({example:100})
  // parentId: number;

  // @ApiProperty({
  //   description: 'Is this a demo account',
  //   example: false,
  // })
  // @Transform(({ value }) => value ? toBoolean(value) : null)
  // @Expose()
  // @IsBoolean()
  // isDemo: boolean;

    // @ApiProperty({
  //   description: 'Registration ID',
  //   example: 'REG2024001',
  //   maxLength: 250,
  //   required: false,
  // })
  // @Expose()
  // @IsOptional()
  // @IsString()
  // @MaxLength(250)
  // registrationId: string;
  
    // @Expose()
  // @Type(() => Number)
  // @IsInt()
  // @ApiProperty({example:100})
  // classId: number;
}