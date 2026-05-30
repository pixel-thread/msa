import { Router } from 'express';
import { auth } from '@src/middleware/auth';
import { listMembers } from './list-members.route';
import { getMember } from './get-member.route';
import { updateMemberRoute } from './update-member.route';
import { deleteMember } from './delete-member.route';
import { updateStatus } from './update-status.route';
import { suspendMember } from './suspend.route';
import { addRole, removeRole } from './change-role.route';
import { getMemberLedger } from './member-ledger.route';
import { onboarding } from './onboarding.route';

const router = Router();

router.use(auth);

router.get('/', listMembers);
router.get('/:memberId', getMember);
router.patch('/:memberId', updateMemberRoute);
router.delete('/:memberId', deleteMember);
router.patch('/:memberId/status', updateStatus);
router.post('/:memberId/suspend', suspendMember);
router.post('/:memberId/role', addRole);
router.put('/:memberId/role', removeRole);
router.get('/:memberId/ledger', getMemberLedger);
router.post('/onboarding', onboarding);

export default router;
