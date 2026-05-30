import { Router } from 'express';
import { auth } from '@src/middleware/auth';
import { listTickets } from './list-tickets.route';
import { submitDsar } from './submit.route';
import { listMyTickets, getMyTicket } from './my-tickets.route';
import {
  getTicket,
  deleteTicket,
  respondToTicket,
  assignTicket,
  rejectTicket,
} from './ticket-detail.route';
import { listAdmins } from './admins.route';
import { getSlaReport } from './sla-report.route';

const router = Router();

router.use(auth);

router.get('/', listTickets);
router.post('/submit', submitDsar);
router.get('/my', listMyTickets);
router.get('/my/:ticketId', getMyTicket);
router.get('/admins', listAdmins);
router.get('/sla-report', getSlaReport);

router.get('/:ticketId', getTicket);
router.delete('/:ticketId', deleteTicket);
router.post('/:ticketId/respond', respondToTicket);
router.patch('/:ticketId/assign', assignTicket);
router.post('/:ticketId/reject', rejectTicket);

export default router;
