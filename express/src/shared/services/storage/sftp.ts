import { env } from '@src/env';
import { logger } from '@src/shared/logger';
import { StorageProvider, UploadParams, UploadResult } from '@src/shared/types/storage';
import SftpClient from 'ssh2-sftp-client';

/** SFTP-backed storage provider. Requires SFTP_HOST, SFTP_USER, SFTP_PASSWORD env vars. */
export class SftpStorageProvider implements StorageProvider {
  async upload(params: UploadParams): Promise<UploadResult> {
    const sftp = new SftpClient('upload-client');
    logger.debug(
      {
        host: env.SFTP_HOST,
        port: env.SFTP_PORT,
        username: env.SFTP_USERNAME,
        readyTimeout: env.SFTP_TIMEOUT,
      },
      '[Storage] SFTP connecting...',
    );

    try {
      await sftp.connect({
        host: env.SFTP_HOST,
        port: env.SFTP_PORT,
        timeout: env.SFTP_TIMEOUT,
        username: env.SFTP_USERNAME,
        password: env.SFTP_PASSWORD,
        readyTimeout: env.SFTP_TIMEOUT,
      });
    } catch (error) {
      logger.debug({ error }, '[Storage] SFTP connection failed');
      await sftp.end();
      throw error;
    }

    const key = `${params.folder}/${Date.now()}-${params.fileName}`;

    try {
      await sftp.put(params.fileBuffer, `/${env.STORAGE_BUCKET}/${key}`);
    } catch (error) {
      logger.debug({ error }, '[Storage] SFTP upload failed');
      throw error;
    } finally {
      await sftp.end();
    }

    return {
      key,
      url: `${env.SFTP_HOST}/${env.SFTP_ROOT}/${key}`,
    };
  }

  /** Removes a file from the SFTP server by its storage key. */
  async delete(fileKey: string) {
    const sftp = new SftpClient();

    await sftp.connect({
      host: env.SFTP_HOST,
      port: env.SFTP_PORT,
      timeout: env.SFTP_TIMEOUT,
      username: env.SFTP_USERNAME,
      password: env.SFTP_PASSWORD,
      readyTimeout: env.SFTP_TIMEOUT,
    });

    await sftp.delete(`/${env.STORAGE_BUCKET}/${fileKey}`);

    await sftp.end();
  }

  /** Returns the public CDN URL for a stored file. */
  async getPublicUrl(fileKey: string) {
    return `${env.SFTP_HOST}/${env.SFTP_ROOT}/${fileKey}`;
  }
}
