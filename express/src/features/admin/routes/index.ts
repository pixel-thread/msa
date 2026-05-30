import { Router, type RequestHandler } from 'express';
import { getAssociations, postAssociation, getAssociationById, putAssociation, deleteAssociationById, postAssociationMember } from './associations.route';
import { getMembershipApplicationsHandler, postApproveApplication, postRejectApplication } from './membership-applications.route';

const router = Router();

router.get('/associations', getAssociations as RequestHandler[]);
router.post('/associations', postAssociation as RequestHandler[]);
router.get('/associations/:id', getAssociationById as RequestHandler[]);
router.put('/associations/:id', putAssociation as RequestHandler[]);
router.delete('/associations/:id', deleteAssociationById as RequestHandler[]);
router.post('/associations/:id/member', postAssociationMember as RequestHandler[]);
router.get('/membership-applications', getMembershipApplicationsHandler as RequestHandler[]);
router.post('/membership-applications/:applicationId/approve', postApproveApplication as RequestHandler[]);
router.post('/membership-applications/:applicationId/reject', postRejectApplication as RequestHandler[]);

export default router;
