import { Router } from 'express';
import { getMeetings } from './get-meetings.route';
import { postCreateMeeting } from './create-meeting.route';
import { getMyMeetings } from './get-my-meetings.route';
import { getMeeting } from './get-meeting.route';
import { patchUpdateMeeting } from './update-meeting.route';
import { deleteMeetingHandler } from './delete-meeting.route';
import { postCancelMeeting } from './cancel-meeting.route';
import { postIssueNotice } from './issue-notice.route';
import { getAttendees } from './attendees/list-attendees.route';
import { postAddAttendee } from './attendees/add-attendee.route';
import { putBulkAssignAttendees } from './attendees/bulk-assign-put.route';
import { postBulkAssignAttendees } from './attendees/bulk-assign.route';
import { patchUpdateAttendee, deleteRemoveAttendee } from './attendees/remove-attendee.route';
import { postRsvp } from './rsvp.route';
import { getAgendaItems } from './agenda/list-agenda.route';
import { postAddAgendaItem } from './agenda/add-agenda-item.route';
import { patchProcessAgendaOperations } from './agenda/process-agenda.route';
import { patchUpdateAgendaItem } from './agenda/update-agenda-item.route';
import { deleteAgendaItemHandler } from './agenda/delete-agenda-item.route';
import { getMinutes } from './minutes/list-minutes.route';
import { postCreateMinute } from './minutes/add-minutes.route';
import { patchUpdateMinute } from './minutes/update-minutes.route';
import { deleteMinute } from './minutes/delete-minutes.route';
import { getMeetingReport } from './report.route';
import { auth } from '@src/middleware/auth';

/** Meetings feature router - aggregates all meeting-related routes. */
const router: Router = Router();
router.use(auth);
// Static routes must be defined before parameterized routes
router.get('/my', getMyMeetings);

// Meeting CRUD
router.get('/', getMeetings);
router.post('/', postCreateMeeting);
router.get('/:meetingId', getMeeting);
router.patch('/:meetingId', patchUpdateMeeting);
router.delete('/:meetingId', deleteMeetingHandler);

// Meeting actions
router.post('/:meetingId/cancel', postCancelMeeting);
router.post('/:meetingId/notice', postIssueNotice);

// Attendees
router.get('/:meetingId/attendees', ...(getAttendees as any));
router.post('/:meetingId/attendees', ...(postAddAttendee as any));
router.put('/:meetingId/attendees', ...(putBulkAssignAttendees as any));
router.post('/:meetingId/attendees/bulk', ...(postBulkAssignAttendees as any));
router.patch('/:meetingId/attendees/:userId', ...(patchUpdateAttendee as any));
router.delete('/:meetingId/attendees/:userId', deleteRemoveAttendee);

// RSVP
router.post('/:meetingId/rsvp', ...(postRsvp as any));

// Agenda
router.get('/:meetingId/agenda', ...(getAgendaItems as any));
router.post('/:meetingId/agenda', ...(postAddAgendaItem as any));
router.patch('/:meetingId/agenda', ...(patchProcessAgendaOperations as any));
router.patch('/:meetingId/agenda/:itemId', ...(patchUpdateAgendaItem as any));
router.delete('/:meetingId/agenda/:itemId', deleteAgendaItemHandler);

// Minutes
router.get('/:meetingId/minutes', ...(getMinutes as any));
router.post('/:meetingId/minutes', ...(postCreateMinute as any));
router.patch('/:meetingId/minutes/:minutesId', ...(patchUpdateMinute as any));
router.delete('/:meetingId/minutes/:minutesId', deleteMinute);

// Report
router.get('/:meetingId/report', getMeetingReport);

export default router;
