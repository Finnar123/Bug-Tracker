const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    topic:{
        type: [String],
        required: true,
    },
    timecreated:{
        type: [String],
        required: true,
    }
})

module.exports = mongoose.model("Notifs", userSchema)