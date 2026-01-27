import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { GeneratingRegistrationService } from './services/generate-registration.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { ChildRegistrationInfoDto, CreateParentChildrenRegistrationDto } from './dto/create-parent-children-registration.dto';
import { FillingRegistrationService } from './services/filling-registration/filling-registration.service';

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
    ) {
      return await this.registrationService.createRegistrationLink(centerId, userId, dto);
    }

    @Get('childrenInfo/:token')
    @HttpCode(HttpStatus.OK)
    async getChildrenInfo(
      @Param('token') token: string,
    ) {
      return await this.parentRegistrationService.getChildRegistrationByToken(token);
    }   
    
}
