const express = require('express')

const router = express.Router()

// const authRoutes = require('./api/auth')
// const userRoutes = require('./api/user');

router.get('/', (req, res) => {
    return res.send('API is Running...')
})
// router.use('/auth', authRoutes)
// router.use('/user', userRoutes);

module.exports = router
