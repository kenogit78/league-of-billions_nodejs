const Joi = require('joi')

const User = require('../models/user')

const check = async (d) => {
    const q = d.indexOf('@') == -1 ? {phone: d} : {email: d}
    const user = await User.findOne(q).exec()
    if (user) {
        throw Error('email already exists.')
    }
}

module.exports = {
    register: Joi.object({
        //email: Joi.string().email().external(check).required(),
        //phone: Joi.string().length(11).external(check).required(),
        email: Joi.alternatives().conditional('email', {is: Joi.exist(), then: Joi.string().email().external(check).required(), otherwise: Joi.optional()}),
        phone: Joi.alternatives().conditional('phone', {is: Joi.exist(), then: Joi.string().length(11).external(check).required(), otherwise: Joi.optional()}),
        password: Joi.string().required()
    }),
    verifyEmail: Joi.object({
        otp: Joi.string().required(),
        account: Joi.string().required()
    }),
    login: Joi.object({
        account: Joi.required(),
        password: Joi.required()
    }),
    reset: Joi.object({
        token: Joi.string().required(),
        password: Joi.string().required()
    }),
    changePassword: Joi.object({
        old_password: Joi.string().required(),
        new_password: Joi.string().required()
    }),
    forgotPassword: Joi.object({
        account: Joi.string().required()
    }),
    resendEmail: Joi.object({
        account: Joi.string().required()
    }),
}
