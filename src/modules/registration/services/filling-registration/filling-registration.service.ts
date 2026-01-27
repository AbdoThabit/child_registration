import { BadRequestException, HttpException, Inject, Injectable, InternalServerErrorException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { ICARE_MSSQL_POOL } from 'src/config/mssql/mssql-client.constants';
import { CareCenter } from 'src/database/icare/entities/entities/CareCenter';
import { ChildRegistration } from 'src/database/icare/entities/entities/ChildRegistration';
import { Class } from 'src/database/icare/entities/entities/Class';
import { Parent } from 'src/database/icare/entities/entities/Parent';
import { ParentRegistrationLink } from 'src/database/icare/entities/entities/ParentRegistrationLinks';
import { Repository } from 'typeorm';
import { GeneratingRegistrationService } from '../generate-registration.service';
import * as mssql from 'mssql';
import { ChildRegistrationMinifiedDto } from '../../dto/child-registration-minfied.dto';
import { plainToClass, plainToInstance } from 'class-transformer';
@Injectable()
export class FillingRegistrationService {
    constructor(
            @InjectRepository(Parent, 'icare')
            private parentRepository: Repository<Parent>,
            @InjectRepository(CareCenter, 'icare')
            private centerRepository: Repository<CareCenter>,
            @InjectRepository(Class, 'icare')
            private classRepository: Repository<Class>,
             @InjectRepository(ParentRegistrationLink, 'icare')
            private parentRegistrationLinkRepository: Repository<ParentRegistrationLink>,
            @InjectRepository(ChildRegistration, 'icare')
            private childRegistrationRepository: Repository<ChildRegistration>,
            private readonly logger: PinoLogger,
            @Inject(ICARE_MSSQL_POOL)
            private readonly icarePool: mssql.ConnectionPool,) {
            this.logger.setContext(GeneratingRegistrationService.name);
            }

            async getChildRegistrationByToken(token: string): Promise<ChildRegistrationMinifiedDto[]> {
                try {
                    const registrationLink = await this.parentRegistrationLinkRepository.findOne({ where: { token } }); 

                    if (!registrationLink) {
                        throw new NotFoundException(`Registration link with token ${token} not found`);
                    }
                    const childRegistrations = await this.childRegistrationRepository.find({ where: { registrationLinkId: registrationLink.id } });

                    if (!childRegistrations || childRegistrations.length === 0) {
                        throw new NotFoundException(`No child registrations found for token ${token}`);
                    }
                    return plainToInstance(ChildRegistrationMinifiedDto, childRegistrations, { excludeExtraneousValues: true });
                } catch (error) {
                    this.handleError(error, `Failed to get child registrations by token: ${error.message}`, { token });
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
