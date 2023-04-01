const mongoose = require('mongoose')

const waitListSchema = new mongoose.Schema({
    email: String,
    password: String,
    credit: Number,
    price: Number
})


module.exports = mongoose.model('waitList', waitListSchema)
///creating schema of users with name and password