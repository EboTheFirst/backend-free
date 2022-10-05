const router = require("express").Router();
const mongo = require("mongoose");
const config = require("config");
const jwt = require("jsonwebtoken");

const MessageModel = mongo.model("Message");

const secretKey = config.get("jwtPrivateKey");
const verify = (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (error) {
    decoded = false;
    console.log(error);
  }
  return decoded;
};

router.post("/send", (req, res) => {
  const decoded = verify(req.headers["x-auth-token"]);
  if (!decoded) {
    return res.status(400).send();
  }
  const message = MessageModel();
  message.sender = decoded._id;
  console.log(message.toObject());
  Object.keys(req.body).forEach((key) => {
    message[key] = req.body[key];
  });
  message.save((err, doc) => {
    if (!err) {
      console.log(doc);
      res.send(doc);
    } else {
      console.log(err);
      res.status(404).send();
    }
  });
});

router.post("/get", (req, res) => {
  const decoded = verify(req.headers["x-auth-token"]);
  if (!decoded) {
    return res.status(400).send();
  }
  MessageModel.find(
    { $or: [{ sender: decoded._id }, { receiver: decoded._id }] })
    .lean()
    .populate("sender","-__v -password")
    .populate("receiver","-__v -password")
    .exec(
    (err, docs) => {
      if (!err) {
        res.send(docs);
      } else {
        console.log(error);
      }
    }
  );
});

router.get("/:interlocutorId", (req, res) => {
  const decoded = verify(req.headers["x-auth-token"]);
  if (!decoded) {
    return res.status(400).send();
  }
  MessageModel.find(
    { $or: [{ $and: [{sender: decoded._id}, { receiver: req.params.interlocutorId }] },
    { $and: [{receiver: decoded._id}, { sender: req.params.interlocutorId }] } ] })
    .lean()
    .populate("sender","-__v -password")
    .populate("receiver","-__v -password")
    .exec(
    (err, docs) => {
      if (!err) {
        res.send(docs);
        console.log(docs);
      } else {
        console.log(err);
      }
    }
  );
});

module.exports = router;
