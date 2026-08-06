export type SignedStorageUrl = Readonly<{
  expiresAt: string;
  url: string;
}>;

export interface ObjectStoragePort {
  createDownloadUrl(objectKey: string, expiresInSeconds: number): Promise<SignedStorageUrl>;
  createUploadUrl(objectKey: string, expiresInSeconds: number): Promise<SignedStorageUrl>;
}
