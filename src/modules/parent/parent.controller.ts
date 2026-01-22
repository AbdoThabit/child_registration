import { Controller, Get, HttpCode, HttpStatus, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ParentService } from './parent.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParentResponseDto } from './dto/parent-response.dto';
import { User } from 'src/common/decorators/user.decorator';

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
}
