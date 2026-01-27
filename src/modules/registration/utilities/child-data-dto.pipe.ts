import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { FillingChildDataDto } from '../dto/filling-child-data.dto';

@Injectable()
export class ParseChildrenArrayPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
   
    if (!value) {
      throw new BadRequestException('Children data is missing');
    }
    // 2. Handle both single objects and arrays (Postman form-data)
    const rawDataArray = Array.isArray(value) ? value : [value];
    try {
      return rawDataArray.map((item) => {
        return new FillingChildDataDto(item);
      });
    } catch (error) {
      throw new BadRequestException('Invalid child data format');
    }
  }
}