const express = require('express');

const router = express.Router();

const userController = require('../../controllers/userController');
const authController = require('../../controllers/authentications');
const auth = require('../../middlewares/authenticate');

router.use(authController.protect);

router.get('/', userController.getAllUsers);

router.get('/profile', userController.getMe, userController.getUser);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', authController.protect, userController.deleteMe);
// router.post('/find', auth, userController.findUser);

module.exports = router;
