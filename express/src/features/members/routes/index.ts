// ---------------------------------------------------------------------------
// External libs
// ---------------------------------------------------------------------------
import { Router } from 'express';

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
import { auth } from '@src/middleware/auth';

// ---------------------------------------------------------------------------
// Route handlers — Members
// ---------------------------------------------------------------------------
import { listMembers } from './list-members.route';
import { getMember } from './get-member.route';
import { updateMemberRoute } from './update-member.route';
import { deleteMember } from './delete-member.route';
import { updateStatus } from './update-status.route';
import { suspendMember } from './suspend.route';
import { addRole, removeRole } from './change-role.route';
import { getMemberLedger } from './member-ledger.route';
import { onboarding } from './onboarding.route';

// ---------------------------------------------------------------------------
// Router — /api/members
// All routes require authentication.
// ---------------------------------------------------------------------------
const router: Router = Router();

router.use(auth);

// ── CRUD ───────────────────────────────────────────────────────────────────
router.get('/', listMembers);
router.get('/:memberId', getMember);
router.patch('/:memberId', updateMemberRoute);
router.delete('/:memberId', deleteMember);

// ── Status / suspension ────────────────────────────────────────────────────
router.patch('/:memberId/status', updateStatus);
router.post('/:memberId/suspend', suspendMember);

// ── Roles ──────────────────────────────────────────────────────────────────
router.post('/:memberId/role', addRole);
router.put('/:memberId/role', removeRole);

// ── Ledger / onboarding ────────────────────────────────────────────────────
router.get('/:memberId/ledger', getMemberLedger);
router.post('/onboarding', onboarding);

export default router;
