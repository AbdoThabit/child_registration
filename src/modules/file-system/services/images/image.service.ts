import { HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ImageInfo } from '../../data/enums';
import path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';
import * as dotenv from 'dotenv';
import * as QRCode from 'qrcode';
import * as filesave from 'fs/promises';
import { PinoLogger } from 'nestjs-pino';
@Injectable()
export class ImageService {
constructor( private readonly logger: PinoLogger
    ) {
        this.logger.setContext(ImageService.name);
      }
    async SaveImage(
    file: Express.Multer.File,
    centerId: string | number,
    info: ImageInfo,
  ): Promise<string> {
    try {
      
      // 1. Generate unique filename
      const ext = path.extname(file.originalname) || '.jpg';
      const newImgName = Date.now().toString() + '-' + Math.round(Math.random() * 1e9);
      centerId = String(centerId)
     let filePath = this.getImageFullPath(centerId, info);
      // 4. Ensure directory exists
      fs.mkdirSync(filePath, { recursive: true });

      // 5. Full path for new image
      const fullPath = path.join(filePath, `${newImgName}${ext}`);

      
      await sharp(file.buffer)
        .resize(1080, 1920, {
          fit: 'inside', 
          withoutEnlargement: true,
        })
        .flatten({ background: '#ffffff' }) // ✅ white background 
        .jpeg({ quality: 90 })
        .toFile(fullPath);

      return `${newImgName}${ext}`;
    } catch (error) {
      this.handleError(error,error.message,{centerId,info,file})
    }
  }
  async DeleteImage(centerId: string | number, info: ImageInfo, filename: string): Promise<boolean> {
    try{
      let filePath = this.getImageFullPath(String(centerId), info);
      filePath = path.join(filePath, filename);
      // 2. Check if file exists
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath); // async deletion
        return true; // deleted successfully
      } else throw new NotFoundException(`the image with name ${filename} was not found`); // file missing
    }catch(err){
      this.handleError(err,err.message,{centerId,info,filename})
    }
    
  }
  async CheckImageExistance (imageName : string , centerId : string| number , info : ImageInfo) : Promise<string>{
        let filePath = this.getImageFullPath(String(centerId),info);
        filePath = path.join(filePath, imageName);
        if (fs.existsSync(filePath)){
          return imageName;
        }
        else {
          return this.getDefualtImageName(info)
        }
  }


  private getImageFullPath(centerId: string | number , info: ImageInfo): string {
    const tempPath = path.join(process.cwd(), 'uploads');
    const baseFolder = path.join(process.env.UPLOAD_BASE_PATH || tempPath);
    let filePath = path.join(baseFolder, String(centerId));
    switch (info) {
        case ImageInfo.Child:
          filePath = path.join(filePath, 'children');
          break;
        case ImageInfo.Parent:
          filePath = path.join(filePath, 'parent');
          break;
        case ImageInfo.Class:
          filePath = path.join(filePath, 'class');
          break;
        case ImageInfo.Provider:
          filePath = path.join(filePath, 'provider');
          break;
        case ImageInfo.Event:
          filePath = path.join(filePath, 'events');
          break;
        case ImageInfo.Album:
          filePath = path.join(filePath, 'photoalbum');
          break;
        case ImageInfo.PickupPerson:
          filePath = path.join(filePath, 'pickup');
          break;
        case ImageInfo.MedicalReport:
          filePath = path.join(filePath, 'medicalreport');
          break;
        case ImageInfo.ScheduleMenuImage:
          filePath = path.join(filePath, 'schedulemenu');
          break;
        case ImageInfo.NotificationIcon:
          filePath = path.join(filePath, 'notification');
          break;
        case ImageInfo.NotificationImage:
          filePath = path.join(filePath, 'notificationimages');
          break;
        case ImageInfo.FoodPhoto:
          filePath = path.join(filePath, 'menuitems');
          break;
        case ImageInfo.Photo:
          filePath = path.join(filePath, 'photo');
          break;
        case ImageInfo.ChildQRCode:
          filePath = path.join(filePath, 'child-qrcode');
          break;
        case ImageInfo.Watermark:
          filePath = path.join(filePath, 'watermark');
          break;  
        default:
          filePath = path.join(filePath, 'children');
          break;
      }
      return filePath;
  }
  getDefualtImageName(info :ImageInfo):string{
    let DefaultImage ;
    switch (info) {
        case ImageInfo.Child:
          DefaultImage = "blank_male.png";
          break;
        case ImageInfo.Parent:
          DefaultImage = "blank_employee.png";
          break;
        case ImageInfo.Class:
          DefaultImage = "blank_class.png";
          break;
        case ImageInfo.Provider:
          DefaultImage = "blank_employee.png";
          break;
        case ImageInfo.Event:
          DefaultImage = "blank_event.png";
          break;
        case ImageInfo.Album:
          DefaultImage = "blank_album.png";
          break;
        case ImageInfo.PickupPerson:
          DefaultImage = "blank_employee.png";
          break;
        case ImageInfo.MedicalReport:
          DefaultImage = "incident_img.jpg";
          break;
        case ImageInfo.Watermark:
          DefaultImage = "watermark.png";
          break;  
        case ImageInfo.ScheduleMenuImage:
          DefaultImage = "";
          break;
        case ImageInfo.PrintableReport:
          DefaultImage = "";
        default:
          DefaultImage = "blank_male.png";
          break;
      }
      return DefaultImage;
   }


   /**
   * Generates QR code with optional watermark and saves to file system
   * @param qrcode - Text/data to encode in QR
   * @param centerId - Center identifier for folder structure
   * @param overwrite - Whether to replace existing QR code
   */
  async generateQrCode(
    qrcode: string,
    centerId: string | number,
    overwrite: boolean = false,
  ): Promise<void> {
  try{
    centerId = String(centerId)
    const watermarkFilename = this.getDefualtImageName(ImageInfo.Watermark);
    const watermarkPath = this.getImageFullPath(centerId, ImageInfo.Watermark);
    const watermarkFullPath = path.join(watermarkPath, watermarkFilename);
    const watermarkExists = fs.existsSync(watermarkFullPath);

    const qrcodePath = this.getImageFullPath(centerId, ImageInfo.ChildQRCode);
    fs.mkdirSync(qrcodePath, { recursive: true });//ensure the folder existed
    const qrcodeFullPath = path.join(qrcodePath, `${qrcode}.png`);
    const qrcodeExists = fs.existsSync(qrcodeFullPath);
    if (!qrcodeExists || overwrite) {
      // 4. Generate QR code
      const qrBuffer = await QRCode.toBuffer(qrcode, {
        errorCorrectionLevel: 'Q', // Equivalent to ECCLevel.Q in C#
        width: 400, //(C# uses pixelsPerModule=20)
        margin: 1,
        color: {
          dark: '#000000',  // Black (equivalent to Color.Black)
          light: '#FFFFFF', // White (equivalent to Color.White)
        },
      });

      let finalImage: Buffer;

      // 5. Check if watermark exists and apply it
      
      if (watermarkExists) {
        finalImage = await this.addWatermark(qrBuffer, watermarkFullPath);
      } else {
        finalImage = qrBuffer;
      }

      // 6. Save as PNG
      await filesave.writeFile(qrcodeFullPath, finalImage);
    }
  }
  catch (err){
      this.handleError(err,err.message,{centerId,qrcode})

  }}
    /**
   * Adds watermark/logo to QR code
   */
  private async addWatermark(
    qrBuffer: Buffer,
    watermarkPath: string,
  ): Promise<Buffer> {
    // Get QR code dimensions
    const qrImage = sharp(qrBuffer);
    const qrMetadata = await qrImage.metadata();

    // Resize watermark to 20% of QR code size
    const watermarkSize = Math.floor(qrMetadata.width * 0.2);
    
    const watermarkBuffer = await sharp(watermarkPath)
      .resize(watermarkSize, watermarkSize, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .toBuffer();

    // Calculate center position
    const left = Math.floor((qrMetadata.width - watermarkSize) / 2);
    const top = Math.floor((qrMetadata.height - watermarkSize) / 2);

    // Composite watermark onto QR code
    const finalImage = await sharp(qrBuffer)
      .composite([
        {
          input: watermarkBuffer,
          top: top,
          left: left,
        },
      ])
      .png()
      .toBuffer();

    return finalImage;
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
    
    // Fallback for everything else
    throw new InternalServerErrorException(
      'An unexpected error occurred while processing the request.',
    );
  }                      
}

