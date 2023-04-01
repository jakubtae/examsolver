const mongoose = require('mongoose')

const usersSchema = new mongoose.Schema({
    email: String,
    password: String,
    credit: Number,
    used: Number
})


module.exports = mongoose.model('users', usersSchema)
///creating schema of users with name and password