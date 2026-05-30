import { Resend } from 'resend';

import { env } from '@src/env';

/** Singleton Resend email client initialized from environment config. */
export const resend = new Resend(env.RESEND_API_KEY);
