import { BadRequestException, HttpException, Inject, Injectable, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { ICARE_MSSQL_POOL } from 'src/config/mssql/mssql-client.constants';
import { CareCenter } from 'src/database/icare/entities/entities/CareCenter';
import { Parent } from 'src/database/icare/entities/entities/Parent';
import { ParentUsers } from 'src/database/isecure/entities/entities/ParentUsers';
import { Repository } from 'typeorm';
import * as mssql from 'mssql';
import { ParentResponseDto } from './dto/parent-response.dto';

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
            return result.recordset as ParentResponseDto[];
        }
        catch(error){
            this.handleError(error, `Failed to get parents by center : ${error.message}` , { centerId });
   
        }
      }


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
