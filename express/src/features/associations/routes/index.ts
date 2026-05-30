import { Router } from 'express';
import { getAssociationByUser, postAssociationCreate, getCurrentAssociation, getAssociationDetail, patchAssociationDetail, postDeactivateAssociation, postUploadLogo, postAddMember } from './associations.route';

const router = Router();

router.get('/', getAssociationByUser);
router.post('/', postAssociationCreate);
router.get('/current', getCurrentAssociation);
router.get('/:associationId', getAssociationDetail);
router.patch('/:associationId', patchAssociationDetail);
router.post('/:associationId/deactivate', postDeactivateAssociation);
router.post('/:associationId/logo', postUploadLogo);
router.post('/:associationId/members', postAddMember);

export default router;
