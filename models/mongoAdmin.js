const mongoose = require('mongoose')

const adminSchema = new mongoose.Schema({
    uname: String,
    password: String
})


module.exports = mongoose.model('Admin', adminSchema)
///creating schema of admin with uname and password