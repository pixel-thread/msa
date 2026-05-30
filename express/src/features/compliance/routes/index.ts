import { Router } from 'express';
import { auth } from '@src/middleware/auth';
import { listComplaints, createComplaintHandler } from './overview.route';
import { listChecks, getCheck, runChecks, deleteCheck } from './checks.route';
import { getEvidence } from './evidence.route';
import { listMyComplaints, getMyComplaint } from './my-complaints.route';

/** Compliance router — aggregates all compliance-related route handlers. */
const router: Router = Router();

router.use(auth);

router.get('/', listComplaints);
router.post('/', createComplaintHandler);

router.get('/checks', listChecks);
router.post('/checks', runChecks);
router.get('/checks/:checkId', getCheck);
router.delete('/checks/:checkId', deleteCheck);

router.get('/evidence', getEvidence);

router.get('/my', listMyComplaints);
router.get('/my/:complaintId', getMyComplaint);

export default router;
