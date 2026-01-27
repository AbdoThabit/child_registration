import { BadRequestException, HttpException, Inject, Injectable, InternalServerErrorException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import * as mssql from 'mssql';
import { InjectRepository } from '@nestjs/typeorm';
import { ICARE_MSSQL_POOL } from 'src/config/mssql/mssql-client.constants';
import { PinoLogger } from 'nestjs-pino';
import { CareCenter } from 'src/database/icare/entities/entities/CareCenter';
import { Parent } from 'src/database/icare/entities/entities/Parent';
import { Class } from 'src/database/icare/entities/entities/Class';
import { ParentRegistrationLink } from 'src/database/icare/entities/entities/ParentRegistrationLinks';
import { ChildRegistration } from 'src/database/icare/entities/entities/ChildRegistration';
import { ChildRegistrationInfoDto, CreateParentChildrenRegistrationDto } from '../dto/create-parent-children-registration.dto';
import { plainToClass } from 'class-transformer';
@Injectable()
export class GeneratingRegistrationService {


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


        daysToExpire :number = 14;

   async createRegistrationLink(centerId: number, userId: number,dto :CreateParentChildrenRegistrationDto ): Promise<string> {
    try {
      const center = await this.centerRepository.findOne({ where: { centerId } });
        if (!center) {
        throw new NotFoundException(`Care center with id ${centerId} not found`);
        }  
      const parent = await this.parentRepository.findOne({ where: { parentId: dto.parentId, centerId } });
      if (!parent) {
        throw new NotFoundException(`Parent with id ${dto.parentId} not found in center ${centerId}`);
      }    
        const token = this.generateSecureToken(16); // 32 hex characters
        const now = new Date();
        const expiresAt = new Date(now.getTime() + this.daysToExpire * 24 * 60 * 60 * 1000); // daysToExpire days from now
        const newLink = this.parentRegistrationLinkRepository.create({
            token,
            centerId,
            parentId: dto.parentId,
            status: 'active',
            expiresAt,
            maxChildren: dto.children.length,
            createdByAdminId: userId,
        });
        const createdLink = await this.parentRegistrationLinkRepository.save(newLink);
        if (!createdLink) {
        throw new InternalServerErrorException('Failed to create parent registration link');
        }
        await this.addChildRegistrationsToLink(createdLink.id, dto.children);
        return token;
    } catch (error) {
      this.handleError(error, `Failed to create registration link: ${error.message}`, { dto, centerId, userId });
    }
}
async addChildRegistrationsToLink(linkId: number, dtos: ChildRegistrationInfoDto[]): Promise<ChildRegistrationInfoDto[]> {
    try {
       let createdChildRegistrations: ChildRegistrationInfoDto[] = [];
      const link = await this.parentRegistrationLinkRepository.findOne({ where: { id: linkId } });
        if (!link) { 
        throw new NotFoundException(`Registration link with id ${linkId} not found`);
        }
        for (const dto of dtos) {
            const classEntity = await this.classRepository.findOne({ where: { classId: dto.classId, centerId: link.centerId } });
            if (!classEntity ||  classEntity.deleted == true) {
                throw new NotFoundException(`Class with id ${dto.classId} not found in center ${link.centerId}`);
            }
            const newChildRegistration = this.childRegistrationRepository.create({
                registrationLinkId: linkId,
                childName: dto.childName,
                classId: dto.classId,
                className: classEntity.className ?? undefined,
                        });
            const createdChildRegistration = await this.childRegistrationRepository.save(newChildRegistration);
            if (!createdChildRegistration) {
                throw new InternalServerErrorException('Failed to create child registration');
            }
            let returnedChildRegistration = plainToClass(ChildRegistrationInfoDto, createdChildRegistration, { excludeExtraneousValues: true });
            createdChildRegistrations.push(returnedChildRegistration);

        }
        return createdChildRegistrations;
    } catch (error) {
        this.handleError(error, `Failed to add child registrations to link: ${error.message}`, { linkId, dtos });
    }
}

   /**
   * Generate a cryptographically secure random token
   * @param length - Number of random bytes (default 32 = 64 hex characters)
   * @returns URL-safe token string
   */
  private generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
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
