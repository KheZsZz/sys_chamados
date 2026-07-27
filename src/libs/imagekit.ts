import ImageKit from 'imagekit';
import { env } from '@/schemas/env.schema';

const imagekit = new ImageKit({
  publicKey: env.IMAGEKIT_PUBLIC_KEY,
  privateKey: env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
});

export type StorageFolder =
  | '/tickets'
  | '/avatars'

export interface UploadResult {
  url: string;
  fileId: string;
}

export const ImagekitClient = {

  uploadFile: async (
      fileBuffer: Buffer,
      fileName: string,
      folder: StorageFolder
    ): Promise<UploadResult> => {
    const response = await imagekit.upload({
      file: fileBuffer,
      fileName: fileName,
      folder: folder,
      useUniqueFileName: true,
    });

    return {
      url: response.url,
      fileId: response.fileId,
    };
  },
  deleteFile: async (fileId: string): Promise<void> => {
    await imagekit.deleteFile(fileId);
  }
};
