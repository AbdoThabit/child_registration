import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { GeneratingRegistrationService } from './services/generate-registration.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { ChildRegistrationInfoDto, CreateParentChildrenRegistrationDto } from './dto/create-parent-children-registration.dto';
import { FillingRegistrationService } from './services/filling-registration/filling-registration.service';
import { FillingChildDataDto } from './dto/filling-child-data.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ParseChildrenArrayPipe } from './utilities/child-data-dto.pipe';
import { CreatedLinkDetails } from './dto/link-details.dto';

@Controller('registration')
export class RegistrationController {
  constructor(private readonly registrationService: GeneratingRegistrationService,
              private readonly parentRegistrationService: FillingRegistrationService
  ) {}


  @Post('createLink')
  @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async createRegistrationLink(
      @User('centerId', ParseIntPipe) centerId: number,
      @User('sub', ParseIntPipe) userId: number,
      @Body() dto: CreateParentChildrenRegistrationDto,
    ):Promise<CreatedLinkDetails> {
      return await this.registrationService.createRegistrationLink(centerId, userId, dto);
    }

    @Get('childrenInfo/:token')
    @HttpCode(HttpStatus.OK)
    async getChildrenInfo(
      @Param('token') token: string,
    ) {
      return await this.parentRegistrationService.getChildRegistrationByToken(token);
    }   
    @Post('childrenInfo/:token')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(
  FileFieldsInterceptor(
    [
      { name: 'photo_0', maxCount: 1 },
      { name: 'photo_1', maxCount: 1 },
      { name: 'photo_2', maxCount: 1 },
      { name: 'photo_3', maxCount: 1 },
      { name: 'photo_4', maxCount: 1 },
      { name: 'photo_5', maxCount: 1 },
      { name: 'photo_6', maxCount: 1 },
      { name: 'photo_7', maxCount: 1 },
      { name: 'photo_8', maxCount: 1 },
      { name: 'photo_9', maxCount: 1 },
    ],
  )
)
    async addChildrenInfo(
      @Param('token') token: string,
      @Body('children', ParseChildrenArrayPipe) dtos: FillingChildDataDto[],
      @UploadedFiles() images: Express.Multer.File[],
    ) {
      return await this.parentRegistrationService.addNewChildData(token, dtos, images);
    }
}
