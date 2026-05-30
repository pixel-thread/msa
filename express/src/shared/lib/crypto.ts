import * as crypto from 'crypto';
import { env } from '@src/env';
import { logger } from '@src/shared/logger';

const ALGORITHM = 'aes-256-gcm';

const KEY = Buffer.from(env.FIELD_ENCRYPTION_KEY, 'hex');

/** Encrypts a plaintext string using AES-256-GCM. Returns a colon-delimited hex string. */
export const encrypt = (plain: string): string => {
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);

  const tag = cipher.getAuthTag();

  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
};

/** Decrypts a string previously encrypted with {@link encrypt}. */
export const decrypt = (ciphertext: string): string => {
  const parts = ciphertext.split(':');

  if (parts.length !== 3) {
    throw new Error(`Invalid encrypted value format`);
  }

  const [ivHex, tagHex, encHex] = parts;

  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, 'hex'));

    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encHex, 'hex')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    logger.error({ error }, 'Failed to decrypt value');

    throw new Error('Failed to decrypt value');
  }
};
