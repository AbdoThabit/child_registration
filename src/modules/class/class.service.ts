import { BadRequestException, HttpException, Inject, Injectable, InternalServerErrorException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ICARE_MSSQL_POOL } from 'src/config/mssql/mssql-client.constants';
import * as mssql from 'mssql';
import { ClassResponseDto } from './dto/class-response.dto';
import { plainToClass } from 'class-transformer';


@Injectable()
export class ClassService {
     constructor(
                private readonly logger: PinoLogger,
                @Inject(ICARE_MSSQL_POOL)
                private readonly icarePool: mssql.ConnectionPool,
                    ) {
                        this.logger.setContext(ClassService.name);
                      }

    async getClassesByCenter(centerId: number , userId: number): Promise<ClassResponseDto[]> { 
        try{
            if (!userId || isNaN(userId)) throw new BadRequestException('Invalid userId');
            if (!centerId || isNaN(centerId)) throw new BadRequestException('Invalid centerId');
            const pool = await this.icarePool.connect();
            const result = await pool.request()
            .input('center_id', mssql.Int, centerId)
            .input('user_id', mssql.Int, userId)
            .execute('iCareWebPanel_getClassesByCenter');
        const classesData = result.recordset;
        if(!classesData || classesData.length === 0){
            throw new NotFoundException(`No classes found for center with id ${centerId}`);
        }
        const classes = classesData.map(cls => plainToClass(ClassResponseDto, cls, { excludeExtraneousValues: true }));
        return classes;
        }
        catch(error){
            this.handleError(error, `Failed to get classes by center : ${error.message}` , { centerId , userId });
      }}


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
