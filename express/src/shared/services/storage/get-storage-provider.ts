import { SupabaseStorageProvider } from './supabase';
import { SftpStorageProvider } from './sftp';
import { env } from '@src/env';

/** Returns the active storage provider based on the STORAGE_PROVIDER env variable. */
export function getStorageProvider() {
  const provider = env.STORAGE_PROVIDER;

  switch (provider) {
    case 'sftp':
      return new SftpStorageProvider();

    case 'supabase':
    default:
      return new SupabaseStorageProvider();
  }
}
