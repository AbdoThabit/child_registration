import {Controller, Get, HttpCode, HttpStatus, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import { ClassService } from './class.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClassResponseDto } from './dto/class-response.dto';
import { User } from 'src/common/decorators/user.decorator';

@Controller('class')
export class ClassController {
  constructor(private readonly classService: ClassService) {}


  @Get()
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async getClassesByCenter(
       @User('centerId', ParseIntPipe) centerId: number,
        @User('sub', ParseIntPipe) userId: number,
    ): Promise<ClassResponseDto[]> {
        return (await this.classService.getClassesByCenter(centerId, userId));
    }
}
