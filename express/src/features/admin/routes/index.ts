import { Router } from 'express';
import {
  getAssociations,
  postAssociation,
  getAssociationById,
  putAssociation,
  deleteAssociationById,
  postAssociationMember,
} from './associations.route';
import {
  getMembershipApplicationsHandler,
  postApproveApplication,
  postRejectApplication,
} from './membership-applications.route';
import { auth } from '@src/middleware/auth';

/** Admin feature router - all routes require authentication. */
const router: Router = Router();
router.use(auth);

router.get('/associations', getAssociations);


router.post('/associations', postAssociation);
router.get('/associations/:id', getAssociationById);
router.put('/associations/:id', putAssociation);
router.delete('/associations/:id', deleteAssociationById);
router.post('/associations/:id/member', postAssociationMember);
router.get('/membership-applications', getMembershipApplicationsHandler);
router.post('/membership-applications/:applicationId/approve', postApproveApplication);
router.post('/membership-applications/:applicationId/reject', postRejectApplication);

export default router;
