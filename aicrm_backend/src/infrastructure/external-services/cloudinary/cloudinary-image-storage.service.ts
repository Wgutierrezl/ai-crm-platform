import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import {
  ImageStoragePort,
  UploadImageInput,
  UploadImageResult,
} from '../../../domain/ports/image-storage.port';

@Injectable()
export class CloudinaryImageStorageService implements ImageStoragePort {
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {}

  async uploadImage(input: UploadImageInput): Promise<UploadImageResult> {
    this.ensureConfigured();

    const folder =
      input.folder ??
      this.configService.get<string>('CLOUDINARY_FOLDER_PRODUCTS') ??
      'products';

    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          secure: true,
          use_filename: true,
          unique_filename: true,
          overwrite: false,
          filename_override: input.fileName,
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error('Cloudinary upload failed'));
            return;
          }
          resolve(result);
        },
      );

      stream.end(input.fileBuffer);
    }).catch(() => {
      throw new InternalServerErrorException(
        'No fue posible subir la imagen del producto',
      );
    });

    return {
      secureUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    };
  }

  private ensureConfigured(): void {
    if (this.isConfigured) return;

    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'Configuracion de Cloudinary incompleta',
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    this.isConfigured = true;
  }
}
