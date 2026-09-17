const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true
    },

    businessName: {
      type: String,
      required: true
    },

    message: {
      type: String,
      required: true
    },

    sender: {
      type: String,
      enum: ["user", "business"],
      default: "user"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Chat", chatSchema);
