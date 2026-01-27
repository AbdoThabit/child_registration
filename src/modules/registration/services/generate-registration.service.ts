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
import { DAYSTOEXPIRE, FORMURL } from '../utilities/constants';
import { CreatedLinkDetails } from '../dto/link-details.dto';
import { Child } from 'src/database/icare/entities/entities/Child';
import { ClassChild } from 'src/database/icare/entities/entities/ClassChild';
import { vwClass } from 'src/database/icare/entities/views/vhClasses';
import { ImageService } from 'src/modules/file-system/services/images/image.service';
@Injectable()
export class AdminRegistrationService {


 constructor(
        private readonly imageService : ImageService,
        @InjectRepository(Parent, 'icare')
        private parentRepository: Repository<Parent>,
        @InjectRepository(CareCenter, 'icare')
        private centerRepository: Repository<CareCenter>,
        @InjectRepository(Class, 'icare')
        private classRepository: Repository<Class>,
        @InjectRepository(Child, 'icare')
        private childRepository: Repository<Child>,
         @InjectRepository(ParentRegistrationLink, 'icare')
        private parentRegistrationLinkRepository: Repository<ParentRegistrationLink>,
        @InjectRepository(ChildRegistration, 'icare')
        private childRegistrationRepository: Repository<ChildRegistration>,
        @InjectRepository(ClassChild, 'icare')
                private classChildRepo: Repository<ClassChild>,
        @InjectRepository(vwClass, 'icare')
                private vhClassRepo: Repository<vwClass>,        
        private readonly logger: PinoLogger,
        @Inject(ICARE_MSSQL_POOL)
        private readonly icarePool: mssql.ConnectionPool,) {
        this.logger.setContext(AdminRegistrationService.name);
        }



   async createRegistrationLink(centerId: number, userId: number,dto :CreateParentChildrenRegistrationDto ): Promise<CreatedLinkDetails> {
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
        const daysToExpire = DAYSTOEXPIRE || 14;
        const expiresAt = new Date(now.getTime() + daysToExpire * 24 * 60 * 60 * 1000); // daysToExpire days from now
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
        let linkDetails = new CreatedLinkDetails()
        linkDetails.linkId = createdLink.id;
        linkDetails.numberOfChildren = dto.children.length;
        linkDetails.token = token;
        linkDetails.url = FORMURL ? `${FORMURL}${token}`:'';
        return linkDetails;
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
                parentId : link.parentId,
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

async approveChild(centerId:number,userId:number,childRegistrationId:number){
try{
  let childRegistrationRecord = await this.childRegistrationRepository.findOne({where:{id : childRegistrationId}})
if (!childRegistrationRecord) throw new NotFoundException(`child registration record with id ${childRegistrationId} was not found`);
if(childRegistrationRecord.status !== 'filled') throw new BadRequestException(`child registration record with id ${childRegistrationId} was not filled by parent`);
    const requestedClass = await this.classRepository.findOne({where:{
      centerId : centerId,
      classId : childRegistrationRecord.classId
    }});
    if(!requestedClass)throw new NotFoundException('class not found');
    const  isPlaceAvailable  = await this.isPlaceAvailable(requestedClass.classId,centerId);
          if(!isPlaceAvailable )throw new RangeError(`there is no available place at this class`);
    let child = new Child();
    child.parentId = childRegistrationRecord.parentId;
    child.childName = childRegistrationRecord.childName;
    child.nationality = childRegistrationRecord.nationality??null;
    child.nationalityId = childRegistrationRecord.nationalityId??null;
    child.placeOfBirth = childRegistrationRecord.placeOfBirth;
    child.childPin = childRegistrationRecord.childPin;
    child.specialNeeds = childRegistrationRecord.specialNeeds??null;
    child.childNotes = childRegistrationRecord.childNotes??null;
    child.isDemo = false;
    child.childDob = childRegistrationRecord.childDob??null;
    child.isActive = true;
    child.deleted = false;
    child.activationDate = new Date();
    child.registrationDate = childRegistrationRecord.registrationDate??null;
    child.canTakephoto = childRegistrationRecord.canTakePhoto;
    child.gender = childRegistrationRecord.gender;
    child.childPhoto = childRegistrationRecord.childPhoto;
    
    let createdChild = await this.childRepository.save(child);
    if(!createdChild)  throw new InternalServerErrorException('failed to add child') 
    const childId = createdChild.childId;
    await this.insertIntoClassChild(childId,childRegistrationRecord.classId);
    await this.generateChildPortalKey(childId);
    const qrcode =await this.generateChildQRCode(childId);
    this.imageService.generateQrCode(qrcode, centerId); 

    childRegistrationRecord.status ='accepted';
    childRegistrationRecord.isComplete = true;

    await this.childRegistrationRepository.save(childRegistrationRecord);

    return {classId : requestedClass.classId, childId : childId , childName :createdChild.childName}
    
}
catch(error){
    this.handleError(error,error.message,{centerId,userId,childRegistrationId});
  }
}



async isPlaceAvailable(classId: number,centerId : number){
const selectedClass = await this.vhClassRepo.findOne({where:{ classId , centerId}});
if (!selectedClass)throw new NotFoundException (`not found class with id ${classId}`);
const capcity = selectedClass.classCapacity;
const totalCount = selectedClass.childCount;
return capcity - totalCount > 0 ;
}

async generateChildQRCode(childId : number):Promise<string>{
const generateQRCodeRequest = this.icarePool.request();
        generateQRCodeRequest.input('child_id', mssql.Int, childId);
        generateQRCodeRequest.output('qrcode', mssql.NVarChar);
        const result = await generateQRCodeRequest.execute('spGenerateChildQrCode');
        return result.output.qrcode;
}

async generateChildPortalKey(childId : number):Promise<string>{
const generateChildPortalKeyRequest = this.icarePool.request();
        generateChildPortalKeyRequest.input('child_id', mssql.Int, childId);
        generateChildPortalKeyRequest.output('key', mssql.NVarChar);
        const result = await generateChildPortalKeyRequest.execute('spGenerateChildPortalKey');
        return result.output.key;
}
async insertIntoClassChild(childId : number,classId : number) : Promise<void>{
try{
const existedClassChild = await this.classChildRepo.findOne({where :{
childId,
classId
}})
this.logger.debug('existedClassChild:', existedClassChild);
if(!existedClassChild){
  let classChild = new ClassChild();
  classChild.childId = childId;
  classChild.classId = classId;
   await this.classChildRepo.save(classChild);
  
  return ;
}
return ;
}catch(error){
  this.handleError(error,error.message,{classId , childId})
}}

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
