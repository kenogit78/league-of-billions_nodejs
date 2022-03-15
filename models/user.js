const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const config = require('../config')

const Schema =  mongoose.Schema

const statuses = ['active', 'blocked', 'suspended', 'deleted']
const user = new Schema({
    fullname: String,
    email: {type: String},
    phone_number: Number,
    username: Schema.Types.Mixed,
    password: String,
    account_verified: Boolean,
    account_verified_at: Date,
    status: {type: String, enum: statuses}
}, {
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at', deleted_at: 'deleted_at'}
})
user.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.__v;
    obj.id = obj._id;
    delete obj._id;
    return obj;
};

user.statics = {
    getOTP() {
      return Math.floor(1000 + Math.random() * 9000)
    },
    generateToken(user) {
        const token = jwt.sign(user, config.secret)
        this.findByIdAndUpdate(user.id, {$addToSet: {tokens: token}}).exec()
        return token
    },
    getHashPassword(password) {
        const salt = bcrypt.genSaltSync()
        return bcrypt.hashSync(password, salt)
    },
    hashPassword(password) {
        const token = this.getHashPassword(password)
        return token.replace(/\//g, '-')
    }
}

user.plugin(mongoosePaginate);
module.exports = mongoose.model('User', user)
