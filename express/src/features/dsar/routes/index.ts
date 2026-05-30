// ---- DSAR - Router

// ---- Imports

// ---- External Libraries

import { Router } from 'express';

// ---- Middleware

import { auth } from '@src/middleware/auth';

// ---- Route Handlers

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

// ---- Router Setup

/** DSAR feature router - all routes require authentication. */
const router: Router = Router();

router.use(auth);

// ---- List Tickets

router.get('/', listTickets);

// ---- Submit Ticket

router.post('/submit', submitDsar);

// ---- My Tickets

router.get('/my', listMyTickets);
router.get('/my/:ticketId', getMyTicket);

// ---- Admins

router.get('/admins', listAdmins);

// ---- SLA Report

router.get('/sla-report', getSlaReport);

// ---- Ticket Detail (by ID)

router.get('/:ticketId', getTicket);
router.delete('/:ticketId', deleteTicket);
router.post('/:ticketId/respond', respondToTicket);
router.patch('/:ticketId/assign', assignTicket);
router.post('/:ticketId/reject', rejectTicket);

export default router;
