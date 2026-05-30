import { Router } from 'express';
import {
  getMemberTypes,
  postMemberType,
  getMemberTypeById,
  patchMemberType,
  deleteMemberType,
} from './member-types.route';
import { auth } from '@src/middleware/auth';

const router: Router = Router();

router.use(auth);

router.get('/', getMemberTypes);

router.post('/', postMemberType);
router.get('/:memberTypeId', getMemberTypeById);
router.patch('/:memberTypeId', patchMemberType);
router.delete('/:memberTypeId', deleteMemberType);

export default router;
