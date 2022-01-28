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
    }
})

module.exports = mongoose.model("Archived Ticket", ticketSchema)