const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const requestSchema = new Schema({
    account: {
        type: String,
        required: true
    },
    projectname: {
        type: String,
        required: true,
    },
    projectid: {
        type: String,
        required: true,
    },
    joiner:{
        type: String,
        required: true,
    },
    joinername:{
        type: String,
        required: true,
    }
})

// accept or decline functionally? 

module.exports = mongoose.model("Project join request", requestSchema)