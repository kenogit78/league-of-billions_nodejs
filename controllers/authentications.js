const moment = require('moment')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const User = require('../models/user')
const Verification = require('../models/verification')
const responseHandler = require('../utils/response')
// const sendgrid = require('../email')
// const nodemailer = require('../nodemailer')
const config = require('../config')
// const {publish} = require('../utils/publisher')

exports.register = async(req, res) => {
    const {fullname, email, phone_number, username, password} = req.body
    const passwordHash = User.getHashPassword(password)
    let user = await User.create({fullname, email, phone_number, password: passwordHash})
    const otp = User.getOTP()
    let account = email 
    // const notification = email ? 'email' : 'sms'
    await Verification.create({
        user: user.id, code: otp, account, type: 'account_verification', expired_at: moment().add(1, 'hour')
    })
    console.log('account', account)

    // const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
    //     expiresIn: '1d',
    //   });

    //   const url = `${process.env.BASEURL}/auth/verification/${token}`;

    // const mailOptions = {
    //         from: `FPL HUB <${config.emailUser}>`,
    //         to: account,
    //         subject: 'Verify Your Account',
    //         html: ` <h2> ${firstname}, Thank you for signing up </h2>
    //                 <h4> Please verify your mail to continue </h4>
    //               <p>Please click this link to verify yourself. <a href="${url}">${url}</a></p>
    //         `
    //     }

    //     nodemailer.Transport(mailOptions)

    // await sendgrid.emailService(qMessage)
    // await publish('email.notification', qMessage)
    return responseHandler.sendSuccess(res, {
        message: 'Account created successfully.',
        data: user
    })
}


exports.userEmailVerify = async (req, res) => {
    const { id } = jwt.verify(req.params.token, process.env.SECRET_KEY);
    
    if (id) {
      const updatedUser = await User.findByIdAndUpdate(id, { confirmed: true });
      if (updatedUser) {
        // return res.redirect(`http://localhost:3000/login`);        // localhost
        return res.redirect(`${process.env.PROD_SITE}`);         
      } else {
        res.status(404);
        throw new Error('User not found!');
      }
    } else {
      res.status(404);
      throw new Error('User not found!');
    }
  }


exports.verifyEmail = async (req, res) => {
    const {otp, account} = req.body
    const verification = await Verification.findOne({code: otp, account}).exec()
    if (verification && verification !== 'used') {
        
        const user = await User.findByIdAndUpdate(verification.user, {
            account_verified: true, account_verified_at: new Date()
        }, {new: true, projection: '-password -tokens'}).exec()
        if (user) {
            await verification.update({status: 'used'})
            return responseHandler.sendSuccess(res, {
                message: 'Account verified successfully',
                data: {
                    user,
                    access_token: User.generateToken({id: user.id}),
                    refresh_token: User.generateToken({id: user.id})
                }
            })
        }
        //no account
        verification.update({status: 'used'})
        return responseHandler.sendError(res, {
            message: 'No Account found.',
            status: 404
        })
    }
    return responseHandler.sendError(res, {
        message: 'Invalid otp.'
    })
}

exports.resendEmail = async (req, res) => {
    const {account} = req.body
    let notification = account.indexOf('@') === -1 ? 'email': 'sms'
    const query = account.indexOf('@') === -1 ? {phone: account}  : {email: account}
    const user = await User.findOne(query).lean()
    if (user) {
        const otp = User.getOTP()
        await Verification.findOneAndUpdate({user: user.id, type: 'account_verification'}, {
            user: user.id,
            code: otp, expired_at: moment().add(1, 'hour'), account, type: 'account_verification'
        }, {upsert: true}).exec()
        // const qMessage = {
        //     event: 'notification',
        //     action: 'SEND_ACCOUNT_VERIFICATION',
        //     data: {
        //         notification,
        //         to: account,
        //         subject: 'Verify Your Account',
        //         payload: {otp}
        //     }
        // }
        // await publish('email.notification', qMessage)
    }
    return responseHandler.sendSuccess(res, {
        message: 'OTP sent successfully.'
    })
}

exports.login = async (req, res) => {
    const {fullname, account, phone_number, username, password} = req.body
    const query = account.indexOf('@') === -1 ? {phone: account}  : {email: account}
    const user = await User.findOne(query).lean().exec()
    if (user) {
        const isPassword = bcrypt.compareSync(password, user.password)
        if (isPassword) {
            if (user.account_verified_at === null) {
                return responseHandler.sendError(res, {
                    message: 'Email address not verified.',
                    status: 401
                })
            }
            const token = User.generateToken({id: user._id})
            return responseHandler.sendSuccess(res, {
                message: 'Login Successfully.',
                data: {
                    fullname,
                    user,
                    phone_number,
                    username,
                    access_token: token,
                    refresh_token: token
                }
            })
        }
    }
    return responseHandler.sendError(res, {
        message: 'email/password not correct.',
        status: 401
    })
}

exports.forgotPassword = async (req, res) => {
    const {account} = req.body
    const query = account.indexOf('@') === -1 ? {phone: account}  : {email: account}
    const notification = account.indexOf('@') === -1 ? 'sms.notification' : 'email.notification'
    const user = await User.findOne(query).lean()
    if (user) {
        const tempass = Math.random().toString(36).slice(-8)
        let token = User.hashPassword(tempass)
        await Verification.findOneAndUpdate({user: user._id, type: 'forgot_password'}, {
            user: user.id,
            code: token, expired_at: moment().add(1, 'hour'), account, type: 'forgot_password'
        }, {upsert: true}).exec()
        const qMessage = {
            event: 'notification',
            action: 'SEND_FORGOT_PASSWORD',
            data: {
                to: account,
                subject: 'Reset Your Password',
                payload: {token}
            }
        }
        // await publish(notification, qMessage)
        // return responseHandler.sendSuccess(res, {
        //     message: 'Password reset link sent successfully.'
        // })
    }
    return responseHandler.sendSuccess(res, {
        message: 'No account found for this account.'
    })
}

exports.resetPassword = async (req, res) => {
    const {token, password} = req.body
    const verification = await Verification.findOne({code: token}).lean()
    if (verification) {
        const user = await User.findByIdAndUpdate(verification.user, {
            password: User.getHashPassword(password)
        }, ).exec()
        if (user) {
            return responseHandler.sendSuccess(res, {
                message: 'Password reset successfully.'
            })
        }
        return responseHandler.sendError(res, {message: 'Account not found.', status: 404})
    }
    return responseHandler.sendError(res, {
        message: verification && verification.status === 'used' ? 'Token used already.': 'Token not found.',
        status: 404
    })
}

exports.changePassword = async (req, res) => {
    let user = req.user 
    let {old_password, new_password} = req.body
    if (user) {
        const isPassword = bcrypt.compareSync(old_password, user.password)
        if (isPassword) {
            await User.findByIdAndUpdate(user.id, {password: User.getHashPassword(new_password)}).exec()
            return responseHandler.sendSuccess(res, {
                message: 'Password change successfully.',
                data: user
            })
        }
        return responseHandler.sendError(res, {
            message: 'Old password not correct.'
        })
    }
    return responseHandler.sendError(res, {
        status: 404,
        message: 'Account not found.'
    })
}

exports.me = async (req, res) => {
    return responseHandler.sendSuccess(res, {
        message: 'User Profile',
        data: req.user
    })
}

exports.editMe = async (req, res) => {
    const payload = req.body
    let user = req.user
    user = await User.findByIdAndUpdate(user._id, payload, {new: true, projection: '-tokens -password'}).exec()
    return responseHandler.sendSuccess(res, {
        message: 'Profile updated successfully.',
        data: user
        
    })
}
