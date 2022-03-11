const jwt = require('jsonwebtoken')
const User = require('../models/user')
const config = require('../config')


const auth = async (req, res, next) => {
    const authorization = req.header('Authorization')
    console.log(authorization)
    if (authorization) {
        try {
            let token = authorization.replace('Bearer ', '').trim()
            let data = jwt.verify(token, config.secret)
            console.log(data)
            let user = await User.findById(data.id, '-tokens').lean().exec();
            if(user) {
                req.user = user
                return next()
            }
            return res.status(403).send({
                status: false,
                message: 'Invalid user token',
                data: null
            })
        }catch (e) {
            console.log(e)
            return res.status(401).send({
                status: false,
                message: 'Invalid token',
            })
        }
    } else {

        return res.status(401).send({
            status: false,
            message: 'No authorization token.',
        })
    }
}

module.exports = auth;
