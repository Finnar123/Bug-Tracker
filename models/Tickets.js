const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ticketSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    projectid: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    owner: {
        type: String,
        required: true,
    },
    members:{
        type: [String],
        required: true,
    },
    id:{
        type: String,
        required: true,
        unique: true,
    },
    status:{
        type: String,
        required: true,
    },
    priority:{
        type: String,
        required: true,
    },
    type:{
        type: String,
        required: true,
    },
    timecreated:{
        type: String,
        required: true,
    },
    timeupdated:{
        type: String,
        required: true,
    }
})

module.exports = mongoose.model("Ticket", ticketSchema)