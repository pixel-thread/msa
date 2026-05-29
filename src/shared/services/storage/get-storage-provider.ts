import 'server-only';
import { SupabaseStorageProvider } from './supabase';
import { SftpStorageProvider } from './sftp';
import { env } from '@src/env';

// Returns SupabaseStorageProvider (default) or SftpStorageProvider based on STORAGE_PROVIDER env.
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
