const moment = require('moment');
const { promisify } = require('util');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const crypto = require('crypto');
const Verification = require('../models/verification');
const responseHandler = require('../utils/response');
// const sendgrid = require('../email')
// const nodemailer = require('../nodemailer')
const config = require('../config');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
// const {publish} = require('../utils/publisher')
const Email = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const signRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });
  Forbidden;
};

const createSendToken = async (user, statusCode, res, type) => {
  const token = signToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    //On localhost, you comment out sameSite for cookies to be set in broswer
    // sameSite: 'none',
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  user.refreshToken = refreshToken;
  const result = await user.save();
  // console.log(user);

  res.cookie('jwt', refreshToken, cookieOptions);

  //Remove password from output
  user.password = undefined;
  user.refreshToken = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    // refreshToken,
    data: {
      user,
    },
  });
};

exports.register = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    fullname: req.body.fullname,
    email: req.body.email,
    username: req.body.username,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

exports.refresh = async (req, res) => {
  const cookies = req.cookies;
  console.log(cookies);
  if (!cookies?.jwt) return res.sendStatus(401);
  const refreshToken = cookies.jwt;

  const user = await User.findOne({ refreshToken }).select({ refreshToken: 0 });
  console.log(refreshToken);

  if (!user) return res.sendStatus(403); //Forbidden
  // evaluate jwt
  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
    // console.log(user.id);

    if (err || user.id !== decoded.id) return res.sendStatus(403);
    const token = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    console.log(token);
    res.json({ token, user });
  });
};

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
};

exports.verifyEmail = async (req, res) => {
  const { otp, account } = req.body;
  const verification = await Verification.findOne({
    code: otp,
    account,
  }).exec();
  if (verification && verification !== 'used') {
    const user = await User.findByIdAndUpdate(
      verification.user,
      {
        account_verified: true,
        account_verified_at: new Date(),
      },
      { new: true, projection: '-password -tokens' }
    ).exec();
    if (user) {
      await verification.update({ status: 'used' });
      return responseHandler.sendSuccess(res, {
        message: 'Account verified successfully',
        data: {
          user,
          access_token: User.generateToken({ id: user.id }),
          refresh_token: User.generateToken({ id: user.id }),
        },
      });
    }
    //no account
    verification.update({ status: 'used' });
    return responseHandler.sendError(res, {
      message: 'No Account found.',
      status: 404,
    });
  }
  return responseHandler.sendError(res, {
    message: 'Invalid otp.',
  });
};

exports.resendEmail = async (req, res) => {
  const { account } = req.body;
  let notification = account.indexOf('@') === -1 ? 'email' : 'sms';
  const query =
    account.indexOf('@') === -1 ? { phone: account } : { email: account };
  const user = await User.findOne(query).lean();
  if (user) {
    const otp = User.getOTP();
    await Verification.findOneAndUpdate(
      { user: user.id, type: 'account_verification' },
      {
        user: user.id,
        code: otp,
        expired_at: moment().add(1, 'hour'),
        account,
        type: 'account_verification',
      },
      { upsert: true }
    ).exec();
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
    message: 'OTP sent successfully.',
  });
};

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and pass exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2) Check if user exist && pass is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError(`Incorrect email or password`, 401));
  }

  console.log(user);
  // 3) If everything is okay, send token to client
  createSendToken(user, 200, res, 'login');
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    //Comment out when in development
    // sameSite: 'none',
    overwrite: true,
    // secure: true,
  });
  res.status(200).json({ status: 'success' });
  // res.clearCookie('jwt');
  // res.end();
  // res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access', 401)
    );
  }
  //   // 2) Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);
  //   // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exist.'),
      401
    );
  }
  // 4) Check if user changed pass after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again', 401)
    );
  }

  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/auth/password/reset/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // 2) If toekn has not expired, and there is user, set the new user password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordExpires = undefined;
  await user.save();
  // 3) Update changedPasswordAt property for the user

  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);
  // console.log(passwordResetToken);
});

exports.changePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection

  const user = await User.findById(req.user.id).select('+password');
  // 2) Check if posted current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }
  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});

exports.me = async (req, res) => {
  return responseHandler.sendSuccess(res, {
    message: 'User Profile',
    data: req.user,
  });
};

exports.editMe = async (req, res) => {
  const payload = req.body;
  let user = req.user;
  user = await User.findByIdAndUpdate(user._id, payload, {
    new: true,
    projection: '-tokens -password',
  }).exec();
  return responseHandler.sendSuccess(res, {
    message: 'Profile updated successfully.',
    data: user,
  });
};
