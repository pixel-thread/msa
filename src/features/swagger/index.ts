import { healthPath } from './paths/health';
import { meetingPaths } from './paths/meeting';
import { attendeePaths } from './paths/attendee';
import { adminPaths } from './paths/admin';
import { subscriptionPaths } from './paths/subscription';
import { memberPaths } from './paths/members';
import { authPaths } from './paths/auth';
import { announcementPaths } from './paths/announcement';
import { associationPaths } from './paths/associations';
import { notificationPaths } from './paths/notifications';
import { userPaths } from './paths/user';
import { paymentPaths } from './paths/payments';
import { memberTypePaths } from './paths/member-type';
import { trainingPaths } from './paths/training';
import { compliancePaths } from './paths/compliance';

export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'MFSA API',
    version: '1.0.0',
    description: 'API documentation for MFSA',
  },
  servers: [
    {
      url: '/api',
      description: 'Current API',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token. Get it from /auth/sign-in',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    ...healthPath,
    ...authPaths,
    ...meetingPaths,
    ...attendeePaths,
    ...adminPaths,
    ...subscriptionPaths,
    ...memberPaths,
    ...announcementPaths,
    ...associationPaths,
    ...notificationPaths,
    ...userPaths,
    ...paymentPaths,
    ...memberTypePaths,
    ...trainingPaths,
    ...compliancePaths,
  },
};

export { healthPath } from './paths/health';
export { authPaths } from './paths/auth';
export { meetingPaths } from './paths/meeting';
export { attendeePaths } from './paths/attendee';
export { adminPaths } from './paths/admin';
export { subscriptionPaths } from './paths/subscription';
export { memberPaths } from './paths/members';
export { announcementPaths } from './paths/announcement';
export { associationPaths } from './paths/associations';
export { notificationPaths } from './paths/notifications';
export { userPaths } from './paths/user';
export { paymentPaths } from './paths/payments';
export { memberTypePaths } from './paths/member-type';
export { trainingPaths } from './paths/training';
export { compliancePaths } from './paths/compliance';
