const express = require('express')
const router = express.Router()

const authController = require('../../controllers/authentications')
const validate = require('../../middlewares/validate')
const auth = require('../../middlewares/authenticate')
const {register, login, reset, resendEmail,changePassword,verifyEmail, forgotPassword} = require('../../validations/authentications')

router.post('/register', validate(register), authController.register)
router.get('/verification/:token', authController.userEmailVerify);
router.post('/verify/account', validate(verifyEmail), authController.verifyEmail)
router.post('/resend/', validate(resendEmail), authController.resendEmail)
router.post('/login', validate(login), authController.login)
router.post('/password/forgot',validate(forgotPassword), authController.forgotPassword)
router.post('/password/reset', validate(reset), authController.resetPassword)
router.post('/password/change', [validate(changePassword), auth], authController.changePassword)
router.get('/me', auth, authController.me)
router.post('/edit', auth, authController.editMe)

module.exports = router
