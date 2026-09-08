const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    category: {
        type: String,
        required: true
    },

    location: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        required: true
    },

    image: {
        type: String,
        default: ""
    }

});

module.exports = mongoose.model("Business", businessSchema);