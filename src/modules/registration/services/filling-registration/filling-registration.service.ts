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
import { AdminRegistrationService } from '../generate-registration.service';
import * as mssql from 'mssql';
import { ChildRegistrationMinifiedDto } from '../../dto/child-registration-minfied.dto';
import { plainToClass, plainToInstance } from 'class-transformer';
import { FillingChildDataDto } from '../../dto/filling-child-data.dto';
import { Gender } from '../../../../common/enums/Gender';
import { ImageService } from 'src/modules/file-system/services/images/image.service';
import { ImageInfo } from 'src/modules/file-system/data/enums';
import { ChildRegistrationResponseDto } from '../../dto/child-registration-response.dto';
@Injectable()
export class ParentRegistrationService {
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
            private readonly imageService : ImageService,
            private readonly logger: PinoLogger,
            @Inject(ICARE_MSSQL_POOL)
            private readonly icarePool: mssql.ConnectionPool,) {
            this.logger.setContext(AdminRegistrationService.name);
            }

    async getChildRegistrationByToken(token: string): Promise<ChildRegistrationMinifiedDto[]> {
        try {
            const registrationLink = await this.parentRegistrationLinkRepository.findOne({ where: { token } }); 

            if (!registrationLink) {
                throw new NotFoundException(`Registration link with token ${token} not found`);
            }
            const childRegistrations = await this.childRegistrationRepository.find({ where: { registrationLinkId: registrationLink.id } });
            const remainingChildrenToFill = childRegistrations.filter(ch=>{
              !ch.isComplete  
            });
            if (!childRegistrations || childRegistrations.length === 0) {
                throw new NotFoundException(`No child registrations found for token ${token}`);
            }
            return plainToInstance(ChildRegistrationMinifiedDto, remainingChildrenToFill, { excludeExtraneousValues: true });
        } catch (error) {
            this.handleError(error, `Failed to get child registrations by token: ${error.message}`, { token });
        }}

    async addNewChildData(token : string, dtos : FillingChildDataDto [],images : Express.Multer.File [] = []):Promise<ChildRegistrationResponseDto>{
        try {
          const registrationLink = await this.parentRegistrationLinkRepository.findOne({ where: { token } }); 

          if (!registrationLink) {
              throw new NotFoundException(`Registration link with token ${token} not found`);
          }

          const now = new Date();
          const validationErrors: string[] = [];

          if (now > registrationLink.expiresAt) {
              validationErrors.push('Registration link has expired');
          }

          if (registrationLink.status !== 'active') {
              validationErrors.push('Registration link is not active');
          }

          if (registrationLink.remainingSlots === 0) {
              validationErrors.push('No remaining slots available');
          } else if (registrationLink.remainingSlots !== null && dtos.length > registrationLink.remainingSlots) {
              validationErrors.push(`Cannot exceed ${registrationLink.remainingSlots} children limit`);
          }

          if (validationErrors.length > 0) {
              throw new BadRequestException(`Invalid registration link: ${validationErrors.join('; ')}`);
          }

          const centerId = registrationLink.centerId;

          for (let i = 0; i < dtos.length; i++) {
              const dto = dtos[i];
              
              let childRegistration = await this.childRegistrationRepository.findOne({ where: { id: dto.id, registrationLinkId: registrationLink.id } });
              if (!childRegistration) {
                throw new BadRequestException(`Child registration with ID ${dto.id} not found for the provided token`);
              }
              // images is an object with keys like photo_0, photo_1, etc. each containing an array of files of size 1
              let photo = dto.gender == Gender.Male ? "blank_male.png" : "blank_female.png";
              const targetField = `photo_${i}`; 
              const image = images[targetField]?.[0];
              if(image){
                photo = await this.imageService.SaveImage(image,centerId,ImageInfo.Child);
              }
              childRegistration.childDob = dto.childDob??null;
              childRegistration.gender = dto.gender;
              childRegistration.specialNeeds = dto.specialNeeds??null;
              childRegistration.childNotes = dto.childNotes??null;
              childRegistration.placeOfBirth = dto.placeOfBirth??null;
              childRegistration.nationality = dto.nationality??null;
              childRegistration.nationalityId = dto.nationalityId??null;
              childRegistration.canTakePhoto = dto.canTakePhoto;
              childRegistration.childPhoto = photo;
              childRegistration.status = 'filled';
              childRegistration.isComplete = true;
            const savedChildRegistration = await this.childRegistrationRepository.save(childRegistration);
            if (!savedChildRegistration) {
                throw new InternalServerErrorException(`Failed to save child registration with ID ${dto.id}`);
            }
            registrationLink.usedChildrenCount += 1;
          }
          if(registrationLink.remainingSlots === 0) {
            registrationLink.status = 'completed';
          }
          await this.parentRegistrationLinkRepository.save(registrationLink);
          const responseDto = new ChildRegistrationResponseDto();
          responseDto.linkId = registrationLink.id;
          responseDto.remainingSlots = registrationLink.remainingSlots;
          responseDto.linkStatus = registrationLink.status;
          responseDto.filledChildrenCount = registrationLink.usedChildrenCount;
          return responseDto;
        }
            catch (error) {
                this.handleError(error, `Failed to add new child data: ${error.message}`, { dtos });
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
