// ---------------------------------------------------------------------------
// Admin feature router — aggregates all admin sub-routes behind authentication
// ---------------------------------------------------------------------------

import { Router } from 'express';

// Middleware
import { auth } from '@src/middleware/auth';

// Route handlers — associations
import {
  getAssociations,
  postAssociation,
  getAssociationById,
  putAssociation,
  deleteAssociationById,
  postAssociationMember,
} from './associations.route';

// Route handlers — membership applications
import {
  getMembershipApplicationsHandler,
  postApproveApplication,
  postRejectApplication,
} from './membership-applications.route';

// ---------------------------------------------------------------------------

const router: Router = Router();

// All admin routes require authentication — every handler inherits this guard
router.use(auth);

// ---------------------------------------------------------------------------
// Associations CRUD
// ---------------------------------------------------------------------------

router.get('/associations', getAssociations);

router.post('/associations', postAssociation);

router.get('/associations/:id', getAssociationById);

router.put('/associations/:id', putAssociation);

router.delete('/associations/:id', deleteAssociationById);

router.post('/associations/:id/member', postAssociationMember);

// ---------------------------------------------------------------------------
// Membership Applications — review workflow
// ---------------------------------------------------------------------------

router.get('/membership-applications', getMembershipApplicationsHandler);

router.post('/membership-applications/:applicationId/approve', postApproveApplication);

router.post('/membership-applications/:applicationId/reject', postRejectApplication);

export default router;
