const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tokenSchema = new mongoose.Schema({
    userId:{
        type: Schema.Types.ObjectId,
        required: true,
        ref: "user"
    },
    code: {
        type: String,
        required: true,
    }
})


module.exports = mongoose.model('Token', tokenSchema)
///creating schema of admin with uname and password