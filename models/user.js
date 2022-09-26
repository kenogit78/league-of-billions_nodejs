const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const config = require('../config');

const Schema = mongoose.Schema;

const statuses = ['active', 'blocked', 'suspended', 'deleted'];
const userSchema = new Schema(
  {
    fullname: String,
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    phone_number: Number,
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    username: {
      type: String,
      unique: true,
      required: [true, 'Please provide your username'],
    },
    club: {
      type: String,
    },
    photo: {
      type: String,
      default: 'default.jpg',
    },
    refreshToken: {
      type: String,
      select: false,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      // required: [true, 'Please confirm password'],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords are not the same',
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    account_verified: Boolean,
    account_verified_at: Date,
    status: { type: String, enum: statuses, select: false },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deleted_at: 'deleted_at',
    },
  }
);
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  obj.id = obj._id;
  delete obj._id;
  return obj;
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ status: { $ne: 'deleted' } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    console.log(changedTimeStamp, JWTTimestamp);
    return JWTTimestamp < changedTimeStamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// userSchema.statics = {
//   getOTP() {
//     return Math.floor(1000 + Math.random() * 9000);
//   },
//   generateToken(user) {
//     const token = jwt.sign(user, config.secret);
//     this.findByIdAndUpdate(user.id, { $addToSet: { tokens: token } }).exec();
//     return token;
//   },
//   getHashPassword(password) {
//     const salt = bcrypt.genSaltSync();
//     return bcrypt.hashSync(password, salt);
//   },
//   hashPassword(password) {
//     const token = this.getHashPassword(password);
//     return token.replace(/\//g, "-");
//   },
// };

const User = mongoose.model('User', userSchema);

module.exports = User;
