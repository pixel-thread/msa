/**
 * @file Admin Router
 * @description This file aggregates all admin-related feature routes behind a central router.
 * It ensures all admin routes are protected by the authentication middleware.
 */

import { Router } from 'express';

import { auth } from '@src/middleware/auth';

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

/**
 * @description Central router for all admin features.
 */
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
