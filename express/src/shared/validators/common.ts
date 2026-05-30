import z from 'zod';
import { PAGE_SIZE } from '../constants';

export const uuidValidiation = z.uuid('Invalid ID');

export const pageSizeValidation = z.coerce
  .number({
    error: 'Page size must be a number',
  })
  .int('Page size must be an integer')
  .min(1, 'Minimum page size is 1')
  .max(50, 'Maximum page size is 100')
  .positive('Page size must be positive')
  .catch(PAGE_SIZE);

export const pageNumberValidation = z.coerce
  .number({
    error: 'Page number must be a number',
  })
  .int('Page number must be an integer')
  .min(1, 'Minimum page number is 1')
  .max(1000, 'Maximum page number is 1000')
  .positive('Page number must be positive')
  .catch(1);
