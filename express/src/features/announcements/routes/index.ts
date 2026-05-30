import { Router } from 'express';
import { getAnnouncements, postAnnouncement } from './announcements.route';
import {
  getAnnouncement,
  putAnnouncement,
  deleteAnnouncement,
  patchAnnouncement,
} from './announcement-detail.route';
import { postMarkRead } from './mark-read.route';
import { postUploadImage } from './upload-image.route';
import { auth } from '@src/middleware/auth';

/** Announcements router — aggregates all announcement-related route handlers. */
const router: Router = Router();
router.use(auth);
router.get('/', getAnnouncements);
router.post('/', postAnnouncement);
router.get('/:announcementId', getAnnouncement);
router.put('/:announcementId', putAnnouncement);
router.delete('/:announcementId', deleteAnnouncement);
router.patch('/:announcementId', patchAnnouncement);
router.post('/:announcementId/read', postMarkRead);
router.post('/:announcementId/upload', postUploadImage);

export default router;
