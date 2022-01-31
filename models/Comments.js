const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ticketSchema = new Schema({
    ticketid: {
        type: String,
        required: true,
    },
    user: {
        type: [String],
    },
    comment: {
        type: [String],
    },
    timesent:{
        type: [String],
    },
})

module.exports = mongoose.model("Comment", ticketSchema)