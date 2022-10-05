const mongo = require("mongoose");

const messageSchema = new mongo.Schema(
  {
    sender: {
      type: mongo.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongo.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type:{
      type: String
    },
    createdAt:{
      type: Date,
      default: Date.now,
      expires: "48h"
    }
  }
);

mongo.model("Message", messageSchema);
