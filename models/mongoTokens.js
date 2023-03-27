const mongoose = require('mongoose')

const tokenSchema = new mongoose.Schema({
    refreshToken: String
})


module.exports = mongoose.model('Token', tokenSchema)
///creating schema of admin with uname and password