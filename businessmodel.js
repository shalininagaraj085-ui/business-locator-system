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
    },

    openingTime: {
        type: String,
        default: "09:00"
    },

    closingTime: {
        type: String,
        default: "21:00"
    },

    liveStatus: {
        type: String,
        enum: ["Low Crowd", "Medium Crowd", "High Crowd", "Closed"],
        default: "Low Crowd"
    },

    waitingTime: {
        type: Number,
        default: 0
    },

    statusNote: {
        type: String,
        default: ""
    },

    statusUpdatedAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Business", businessSchema);
