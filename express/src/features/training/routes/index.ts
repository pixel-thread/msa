// ---- External libs ----
import { Router } from 'express';

// ---- Shared utilities ----
import { auth } from '@src/middleware/auth';

// ---- Route handlers ----
import { getModules, postModules } from './modules.route';
import { getModule, updateModuleHandler, deleteModuleHandler } from './module-detail.route';
import {
  getAssignments,
  postAssign,
  putBulkAssign,
  deleteAssignment,
  patchBulkRemove,
  getAssignedUsersHandler,
} from './assign-users.route';
import { getMyAssignments, getMyCompletions } from './my-assignments.route';
import { getCompletions, postCompletion } from './record-completion.route';
import { getModuleCompletions, postModuleComplete, postAdminComplete } from './completions.route';
import {
  getCertificates,
  postCertificate,
  getCertificate,
  patchCertificate,
  deleteCertificateHandler,
  postCertificateTemplate,
  deleteCertificateTemplateRoute,
} from './certificates.route';
import {
  getSupplements,
  postSupplement,
  getSupplement,
  updateSupplementHandler,
  deleteSupplementHandler,
} from './supplements.route';

// ---- Router ----

/** Training feature router - all routes require authentication. */
const router: Router = Router();

router.use(auth);

// ---- Modules ----
router.get('/modules', getModules);
router.post('/modules', postModules);

// ---- My views ----
router.get('/my-assignments', getMyAssignments);
router.get('/my-completions', getMyCompletions);

// ---- Admin completions ----
router.get('/completions', getCompletions);
router.post('/completions', postCompletion);

// ---- Module detail ----
router.get('/:moduleId', getModule);
router.patch('/:moduleId', updateModuleHandler);
router.delete('/:moduleId', deleteModuleHandler);

// ---- Assignments (module-scoped) ----
router.get('/:moduleId/assign', getAssignments);
router.post('/:moduleId/assign', postAssign);
router.put('/:moduleId/assign', putBulkAssign);
router.delete('/:moduleId/assign', deleteAssignment);
router.patch('/:moduleId/assign', patchBulkRemove);
router.get('/:moduleId/assigned-users', getAssignedUsersHandler);

// ---- Completions (module-scoped) ----
router.get('/:moduleId/complete', getModuleCompletions);
router.post('/:moduleId/complete', postModuleComplete);
router.post('/:moduleId/assignments/:userId/complete', postAdminComplete);

// ---- Certificates (module-scoped) ----
router.get('/:moduleId/certificates', getCertificates);
router.post('/:moduleId/certificates', postCertificate);
router.get('/:moduleId/certificates/:certificateId', getCertificate);
router.patch('/:moduleId/certificates/:certificateId', patchCertificate);
router.delete('/:moduleId/certificates/:certificateId', deleteCertificateHandler);
router.post('/:moduleId/certificate-template', postCertificateTemplate);
router.delete('/:moduleId/certificate-template', deleteCertificateTemplateRoute);

// ---- Supplements (module-scoped) ----
router.get('/:moduleId/supplements', getSupplements);
router.post('/:moduleId/supplements', postSupplement);
router.get('/:moduleId/supplements/:supplementId', getSupplement);
router.patch('/:moduleId/supplements/:supplementId', updateSupplementHandler);
router.delete('/:moduleId/supplements/:supplementId', deleteSupplementHandler);

export default router;
