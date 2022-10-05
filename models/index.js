const mongo = require("mongoose");
const config = require("config");

mongo.connect(
  config.get("db"),
  { useNewUrlParser: true, useUnifiedTopology: true },
  function (err) {
    if (!err) {
      console.log("Connected successfully to MongodB database");
    } else {
      console.log("Could not connect to database");
    }
  }
);

require("./post.model");
require("./user.model");
require("./message.model");
