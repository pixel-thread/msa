import { Router } from 'express';
import { listComplaints } from './overview.route';
import { listChecks, getCheck } from './checks.route';
import { postEvidence } from './evidence.route';
import { listMyComplaints, createMyComplaint, getMyComplaint, updateMyComplaint } from './my-complaints.route';

const router = Router();

router.get('/', listComplaints);

router.get('/checks', listChecks);
router.get('/checks/:checkId', getCheck);

router.post('/evidence', postEvidence);

router.get('/my', listMyComplaints);
router.post('/my', createMyComplaint);
router.get('/my/:complaintId', getMyComplaint);
router.put('/my/:complaintId', updateMyComplaint);

export default router;
