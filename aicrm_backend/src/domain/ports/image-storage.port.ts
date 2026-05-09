export interface UploadImageInput {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  folder?: string;
}

export interface UploadImageResult {
  secureUrl: string;
  publicId: string;
}

export abstract class ImageStoragePort {
  abstract uploadImage(input: UploadImageInput): Promise<UploadImageResult>;
}
