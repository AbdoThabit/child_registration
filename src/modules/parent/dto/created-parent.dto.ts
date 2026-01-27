import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class createdParentDto {
    @Expose()
    @ApiProperty()
    id: number;
    @Expose()
    @ApiProperty()
    parentId: string;
    @Expose()
    @ApiProperty()
    parentName: string;
    @Expose()
    @ApiProperty()
    centerId: number;
    // @Expose()
    // @ApiProperty()
    // primaryMobile: string;
    @Expose()
    @ApiProperty()
    childrenCount: number;
    @Expose()
    @ApiProperty()
    userName: string;
    @Expose()
    @ApiProperty()
    pin: string;


}