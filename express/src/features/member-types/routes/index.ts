import { Router } from 'express';
import { getMemberTypes, postMemberType, getMemberTypeById, patchMemberType, deleteMemberType } from './member-types.route';

const router = Router();

router.get('/', getMemberTypes);
router.post('/', postMemberType);
router.get('/:memberTypeId', getMemberTypeById);
router.patch('/:memberTypeId', patchMemberType);
router.delete('/:memberTypeId', deleteMemberType);

export default router;
