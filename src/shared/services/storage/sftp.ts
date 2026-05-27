import { env } from "@src/env";
import {
  StorageProvider,
  UploadParams,
  UploadResult,
} from "@src/shared/types/storage";
import SftpClient from "ssh2-sftp-client";

// SFTP-backed storage. Requires SFTP_HOST, SFTP_USER, SFTP_PASSWORD, CDN_URL env vars.
export class SftpStorageProvider implements StorageProvider {
  // Uploads a file to /uploads/<folder>/<timestamp>-<name>, returns key + CDN URL.
  async upload(params: UploadParams): Promise<UploadResult> {
    const sftp = new SftpClient();

    await sftp.connect({
      host: process.env.SFTP_HOST!,
      port: 22,
      username: process.env.SFTP_USER!,
      password: process.env.SFTP_PASSWORD!,
    });

    const key = `${params.folder}/${Date.now()}-${params.fileName}`;

    await sftp.put(params.fileBuffer, `/${env.STORAGE_BUCKET}/${key}`);

    await sftp.end();

    return {
      key,
      url: `${process.env.CDN_URL}/${key}`,
    };
  }

  // Removes a file from the SFTP server by its storage key.
  async delete(fileKey: string) {
    const sftp = new SftpClient();

    await sftp.connect({
      host: process.env.SFTP_HOST!,
      username: process.env.SFTP_USER!,
      password: process.env.SFTP_PASSWORD!,
    });

    await sftp.delete(`/${env.STORAGE_BUCKET}/${fileKey}`);

    await sftp.end();
  }

  // Returns the public CDN URL for a stored file.
  async getPublicUrl(fileKey: string) {
    return `${process.env.CDN_URL}/${fileKey}`;
  }
}
