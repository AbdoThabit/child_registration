import { BadRequestException, HttpException, Inject, Injectable, InternalServerErrorException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { ICARE_MSSQL_POOL } from 'src/config/mssql/mssql-client.constants';
import { CareCenter } from 'src/database/icare/entities/entities/CareCenter';
import { Parent } from 'src/database/icare/entities/entities/Parent';
import { ParentUsers } from 'src/database/isecure/entities/entities/ParentUsers';
import { Repository } from 'typeorm';
import * as mssql from 'mssql';
import { ParentResponseDto } from './dto/parent-response.dto';
import { plainToClass } from 'class-transformer';
import { not } from 'rxjs/internal/util/not';
import { createdParentDto } from './dto/created-parent.dto';
import { CreateNewParentDto } from './dto/Create-new-parent.dto';

@Injectable()
export class ParentService {
    constructor(@InjectRepository(ParentUsers, 'isecure')
        private parentUsersRepository: Repository<ParentUsers>,
        @InjectRepository(Parent, 'icare')
        private parentRepository: Repository<Parent>,
        @InjectRepository(CareCenter, 'icare')
        private centerRepository: Repository<CareCenter>,
        private readonly logger: PinoLogger,
        @Inject(ICARE_MSSQL_POOL)
        private readonly icarePool: mssql.ConnectionPool,) {
        this.logger.setContext(ParentService.name);
        }
async getParentsByCenter(centerId: number ): Promise<ParentResponseDto[]> { 
        try{
            if (!centerId || isNaN(centerId)) throw new BadRequestException('Invalid centerId');
            const pool = await this.icarePool.connect();
            const result = await pool.request()
            .input('center_id', mssql.Int, centerId)
            .execute('getParentsByCenter');
            const parentsData = result.recordset;
            if(!parentsData || parentsData.length === 0){
                throw new NotFoundException(`No parents found for center with id ${centerId}`);
            }

            const parents = parentsData.map(parent => plainToClass(ParentResponseDto, parent, { excludeExtraneousValues: true }));
            return parents;
        }
        catch(error){
            this.handleError(error, `Failed to get parents by center : ${error.message}` , { centerId });
   
        }
      }

async CreateNewParent(centerId : number,dto : CreateNewParentDto){
    try{
    const center = await this.centerRepository.findOne({
        where: { centerId}
        })
        if(!center) throw new NotFoundException(`Care center with id ${centerId} not found`);
       const parentId = this.generateParentId();
       const newParent = this.parentRepository.create(dto);
       newParent.parentId = parentId;
       newParent.centerId = centerId;
       const createdParent = await this.parentRepository.save(newParent);
       if(!createdParent) throw new InternalServerErrorException('Failed to create new parent');
       const parentUser = new ParentUsers();
       parentUser.parentId = createdParent.parentId;
       parentUser.username = this.generateUserName(centerId, createdParent.id);
       parentUser.formattedUserName = createdParent.parentName;
       parentUser.userPassword = dto.pin;
       parentUser.isActive = true;
       parentUser.centerId = centerId;
       parentUser.centerType = center.type;
       const savedParentUser = await this.parentUsersRepository.save(parentUser);
       if(!savedParentUser) throw new InternalServerErrorException('Failed to create parent user for parentId : ' + createdParent.parentId);
       let returnedParent = plainToClass(createdParentDto, createdParent,{ excludeExtraneousValues: true });
       returnedParent.userName = parentUser.username;
       returnedParent.pin = parentUser.userPassword;
       return returnedParent;
    }
    catch(error){
        this.handleError(error, `Failed to create new parent : ${error.message}` , { dto });
    }
}
private generateParentId(): string {
    const startDate = new Date('2012-01-01T00:00:00Z');
    const now = new Date();
    const totalSeconds = (now.getTime() - startDate.getTime()) / 1000;
    const roundedSeconds = Math.round(totalSeconds).toString();
    console.log(roundedSeconds);
    return roundedSeconds;
}

private generateUserName(centerId: number, id: number): string{
  return `PN${centerId}@${id}`;
};
private handleError(error: any, message: string, context: object): never {
    // Log the error with full context
    this.logger.error(
      {
        err: error, // Logs the full error object 
        message: error.message,
        stack: error.stack,
        ...context
      },
      message,
    );

    //  Pass through existing NestJS HttpExceptions (NotFound, BadRequest, etc.)
    if (error instanceof HttpException) {
      throw error;
    }

    // Handle specific Database Connection errors
    if (error.name === 'ConnectionError') {
      throw new ServiceUnavailableException('Database service is currently unavailable.');
    }

    // Handle specific MSSQL "Record Not Found" errors (often from SPs)
    if (error instanceof mssql.RequestError && error.message.includes('not found')) {
      throw new BadRequestException(error.message);
    }

    // Fallback for everything else
    throw new InternalServerErrorException(
      'An unexpected error occurred while processing the request.',
    );
  }

}
