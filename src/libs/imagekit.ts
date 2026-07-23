import ImageKit from 'imagekit';

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
});

export type StorageFolder =
  | '/tickets'
  | '/avatars'


export const ImagekitClient = {

  uploadFile: async (
      fileBuffer: Buffer,
      fileName: string,
      folder: StorageFolder
    ): Promise<string> => {
    const response = await imagekit.upload({
      file: fileBuffer,
      fileName: fileName,
      folder: folder,
      useUniqueFileName: true,
    });

    return response.url;
  },
  deleteFile: async (fileId: string): Promise<void> => {
    await imagekit.deleteFile(fileId);
  }
};
