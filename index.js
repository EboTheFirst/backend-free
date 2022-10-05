require("./models");
const express = require("express");
const bodyParser = require("body-parser");
const listingsRouter = require("./routes/listings.router");
const authRouter = require("./routes/auth.router");
const messagesRouter = require("./routes/messages.router");
const app = express();
const cors = require("cors");

const port = process.env.PORT || 4000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

app.use("/listings", listingsRouter);
app.use("/auth", authRouter);
app.use("/messages", messagesRouter);

app.listen(port, (err) => {
  console.log("Server Running");
  if (err) {
    console.log("Not Running");
  }
});
