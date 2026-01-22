
import {Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
export class ParentResponseDto {
    @Expose({name : 'parent_id'})
    @ApiProperty({ description: 'Parent ID' })
    parentId: string;
    @Expose({name : 'center_id'})
    @ApiProperty({ description: 'Center ID' })
    centerId: number;
    @Expose({name : 'primary_mobile'})
    @ApiProperty()
    primaryMobile: string;
    @Expose({name : 'primary_landline'})
    @ApiProperty()
    primaryLandline: string;
    @Expose({name : 'emergency_mobile'})
    @ApiProperty()
    emergencyMobile: string;
    @Expose({name : 'emergency_landline'})
    @ApiProperty()
    emergencyLandline: string;
    @Expose({name : 'parent_name'})
    @ApiProperty()
    parentName: string;
    @Expose({name : 'spouse_name'})
    @ApiProperty()
    spouseName: string;
    @Expose({name : 'primary_contact'})
    @ApiProperty()
    primaryContact: string;
    @Expose({name : 'emergency_contact'})
    @ApiProperty()
    emergencyContact: string;
    @Expose({name : 'primary_address'})
    @ApiProperty()
    primaryAddress: string;
    @Expose({name : 'secondary_address'})
    @ApiProperty()
    email: string;
    @Expose({name : 'parent_title'})
    @ApiProperty()
    parentTitle: number;
    @Expose({name : 'all_child_name'})
    @ApiProperty()
    allChildName: string;
    @Expose({name : 'registration_id'})
    @ApiProperty()
    registrationId: string;
    @Expose({name : 'parent_occupation'})
    @ApiProperty()
    parentProfession: string;
    @Expose({name : 'spouse_occupation'})
    @ApiProperty()
    spouseProfession: string;
    @Expose({name : 'spouse_email'})
    @ApiProperty()
    spouseEmail: string;
    @Expose({name : 'children_count'})
    @ApiProperty()
    childrenCount: number;
}