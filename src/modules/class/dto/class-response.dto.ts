import {Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
export class ClassResponseDto {
    @Expose()
    @ApiProperty()
    classId: number;

    @Expose()
    @ApiProperty()
    classTheme: string;

    @Expose()
    @ApiProperty()
    classLogo: string;

    @Expose()
    @ApiProperty()
    classSection: string;

    @Expose()
    @ApiProperty()
    className: string;

    @Expose()
    @ApiProperty()
    classDescription: string;

    @Expose()
    @ApiProperty()
    classCategory?: number;

    @Expose()
    @ApiProperty()
    classCapacity?: number;

    @Expose()
    @ApiProperty()
    childCount: number;
}