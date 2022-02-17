const mongoose = require('mongoose');
// const mongoosePaginate = require('mongoose-paginate-v2');
// const jwt = require('jsonwebtoken')
// const bcrypt = require('bcrypt')

const config = require('../config')

const Schema =  mongoose.Schema

const statuses = ['active', 'blocked', 'suspended', 'deleted']
const user = new Schema({
    firstname: String,
    lastname: String,
    email: {type: String},
    password: String,
    username: String,
    phone: String,
    profile_picture: String,
    bio: String,
    location: String,
    country: String,
    date_of_birth: Date,
    account_verified: Boolean,
    account_verified_at: Date,
    status: {type: String, enum: statuses}
})

module.exports = mongoose.model('User', user)