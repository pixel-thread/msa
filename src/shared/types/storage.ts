export interface StorageProvider {
  upload(params: UploadParams): Promise<UploadResult>;
  delete(fileKey: string): Promise<void>;
  getPublicUrl(fileKey: string): Promise<string>;
}

export interface UploadParams {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  folder?: string;
}

export interface UploadResult {
  key: string;
  url: string;
}
