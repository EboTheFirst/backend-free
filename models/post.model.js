const mongo = require("mongoose");

const postSchema = new mongo.Schema({
  poster: {
    type: mongo.Schema.ObjectId,
    ref: "User",
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  category: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  images: {
    type: Array,
    required: true,
  },
});

mongo.model("Post", postSchema);
