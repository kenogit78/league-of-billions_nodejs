const express = require('express')
const router = express.Router()

const userController = require('../../controllers/users')
const auth = require('../../middlewares/authenticate')

router.get('/profile', auth, userController.profile);
router.put('/edit-profile', auth, userController.editProfile);
router.post('/find', auth, userController.findUser);

module.exports = router