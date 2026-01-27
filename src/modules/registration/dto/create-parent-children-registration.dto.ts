import { Type } from 'class-transformer';
import {
  IsNumber,
  IsString,
  IsArray,
} from 'class-validator';



export class CreateParentChildrenRegistrationDto {
    @IsString()
    parentId: string;
    @IsArray()
    @Type(() => ChildRegistrationInfoDto) 
    children: ChildRegistrationInfoDto[];
}

export class ChildRegistrationInfoDto {
    @IsString()
    childName: string;
    @IsNumber()
    classId: number;
}