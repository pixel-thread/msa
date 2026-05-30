import { StorageProvider, UploadParams } from '@src/shared/types/storage';
import { UploadResult } from '@sharedType/storage';
import { supabase as supabseClient } from '@lib/supabase';
import { env } from '@src/env';

/** Supabase Storage-backed provider. Requires SUPABASE_URL and SUPABASE_SECRET_KEY env vars. */
export class SupabaseStorageProvider implements StorageProvider {
  private supabase = supabseClient;

  async upload(params: UploadParams): Promise<UploadResult> {
    const key = `${params.folder}/${Date.now()}-${params.fileName}`;

    const { error } = await this.supabase.storage
      .from(env.STORAGE_BUCKET)
      .upload(key, params.fileBuffer, {
        contentType: params.mimeType,
        upsert: true,
        cacheControl: '3600',
      });

    if (error) throw error;

    const { data } = this.supabase.storage.from(env.STORAGE_BUCKET).getPublicUrl(key);

    return {
      key,
      url: data.publicUrl,
    };
  }

  /** Removes a file from the storage bucket by its key. */
  async delete(fileKey: string) {
    await this.supabase.storage.from(env.STORAGE_BUCKET).remove([fileKey]);
  }

  /** Returns the public URL for a stored file. */
  async getPublicUrl(fileKey: string) {
    return this.supabase.storage.from(env.STORAGE_BUCKET).getPublicUrl(fileKey).data.publicUrl;
  }
}
