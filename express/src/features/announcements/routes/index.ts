/**
 * @file index.ts
 * @description Announcements feature router — aggregates all announcement sub-routes.
 * Enforces authentication on all endpoints.
 *
 * @module features/announcements/routes
 */

import { Router } from 'express';

// Middleware
import { auth } from '@src/middleware/auth';

// Route handlers — announcements CRUD
import { getAnnouncements, postAnnouncement } from './announcements.route';

// Route handlers — single announcement operations
import {
  getAnnouncement,
  putAnnouncement,
  deleteAnnouncement,
  patchAnnouncement,
} from './announcement-detail.route';

// Route handlers — read receipts & image uploads
import { postMarkRead } from './mark-read.route';
import { postUploadImage } from './upload-image.route';

/**
 * Express router for announcements.
 *
 * All routes are prefixed with the base path defined in the main app (typically /api/announcements).
 * Authentication middleware is applied globally to this router.
 */
const router: Router = Router();

// All announcement routes require authentication
router.use(auth);

// -- Announcement collection ------------------------------------------------

router.get('/', getAnnouncements);

router.post('/', postAnnouncement);

// -- Single announcement CRUD -----------------------------------------------

router.get('/:announcementId', getAnnouncement);

router.put('/:announcementId', putAnnouncement);

router.delete('/:announcementId', deleteAnnouncement);

router.patch('/:announcementId', patchAnnouncement);

// -- Announcement actions ---------------------------------------------------

router.post('/:announcementId/read', postMarkRead);

router.post('/:announcementId/upload', postUploadImage);

export default router;
