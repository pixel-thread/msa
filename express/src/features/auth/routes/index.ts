import { Router } from 'express';
import { auth } from '@src/middleware/auth';
import { postSignIn } from './sign-in.route';
import { postSignUp } from './sign-up.route';
import { postSignInVerify } from './sign-in-verify.route';
import { getMe } from './me.route';
import { postRefresh } from './refresh.route';
import { postLogout } from './logout.route';
import { postChangePassword } from './change-password.route';
import { postForgotPassword } from './forgot-password.route';
import { postResetPassword } from './reset-password.route';
import { postSignInResend } from './sign-in-resend.route';
import { postMfaSetup } from './mfa/setup.route';
import { postMfaVerify } from './mfa/verify.route';
import { postMfaResend } from './mfa/resend.route';
import { postMfaDisable } from './mfa/disable.route';

const router = Router();

router.post('/sign-in', postSignIn);
router.post('/sign-up', postSignUp);
router.post('/sign-in/verify', postSignInVerify);
router.post('/sign-in/resend', postSignInResend);
router.get('/me', auth, getMe);
router.post('/refresh', postRefresh);
router.post('/logout', auth, postLogout);
router.post('/change-password', auth, postChangePassword);
router.post('/forgot-password', postForgotPassword);
router.post('/reset-password', postResetPassword);
router.post('/mfa/setup', auth, postMfaSetup);
router.post('/mfa/verify', auth, postMfaVerify);
router.post('/mfa/resend', auth, postMfaResend);
router.post('/mfa/disable', auth, postMfaDisable);

export default router;
