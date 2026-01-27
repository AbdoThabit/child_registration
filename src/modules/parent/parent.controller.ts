import { Body, Controller, Get, HttpCode, HttpStatus, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ParentService } from './parent.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParentResponseDto } from './dto/parent-response.dto';
import { User } from 'src/common/decorators/user.decorator';
import { CreateNewParentDto } from './dto/Create-new-parent.dto';
import { createdParentDto } from './dto/created-parent.dto';

@Controller('parent')
export class ParentController {
  constructor(private readonly parentService: ParentService) {}


  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getParentsByCenter(
        @User('centerId', ParseIntPipe) centerId: number,
        ): Promise<ParentResponseDto[]> {
      return (await this.parentService.getParentsByCenter(centerId));
  }
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async createParent(
        @User('centerId', ParseIntPipe) centerId: number,
        @Body() dto: CreateNewParentDto
        ): Promise<createdParentDto> {
      return await this.parentService.CreateNewParent(centerId, dto);
  }
}
