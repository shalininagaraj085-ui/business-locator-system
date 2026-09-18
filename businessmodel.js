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
   services: [
    {
        name: {
            type: String,
            default: ""
        },

        price: {
            type: Number,
            default: 0
        }
    }
]
});

module.exports = mongoose.model("Business", businessSchema);
