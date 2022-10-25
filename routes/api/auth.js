const express = require('express');
const router = express.Router();

const authController = require('../../controllers/authentications');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/authenticate');
const {
  register,
  login,
  reset,
  resendEmail,
  changePassword,
  verifyEmail,
  forgotPassword,
} = require('../../validations/authentications');

router.post('/register', authController.register);
router.get('/verification/:token', authController.userEmailVerify);
router.post(
  '/verify/account',
  validate(verifyEmail),
  authController.verifyEmail
);
router.post('/resend/', validate(resendEmail), authController.resendEmail);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.get('/refresh', authController.refresh);
router.post('/password/forgot', authController.forgotPassword);
router.patch('/password/reset/:token', authController.resetPassword);
router.patch(
  '/password/change',
  authController.protect,
  authController.changePassword
);
router.get('/me', auth, authController.me);
router.post('/edit', auth, authController.editMe);

module.exports = router;
