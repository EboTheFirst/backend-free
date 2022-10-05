const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const config = require("config");
const mailer = require("nodemailer");
const sendNotification = require("../expo/pushNotifications");

const mongo = require("mongoose");
const UserModel = mongo.model("User");

const secretKey = config.get("jwtPrivateKey");
const rounds = 10;

const verify = (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (error) {
    decoded = false;
  }
  return decoded;
};

const transporter = mailer.createTransport({
  service: "gmail",
  auth: {
    user: config.get("email"),
    pass: config.get("app_pass"),
  },
});

router.post("/register", (req, res) => {
  UserModel.findOne({ email: req.body.email }, (err, doc) => {
    if (doc) {
      return res.sendStatus(400);
    }
  });
  let user = {};
  Object.keys(req.body).map((key) => {
    user[key] = req.body[key];
  });
  console.log(user);
  bcrypt.hash(req.body.password, rounds, (err, encryted) => {
    if (!err) {
      user.password = encryted;
      let token = jwt.sign(user, secretKey);

      const mailOptions = {
        from: "Free",
        to: user.email,
        subject: "Free Email Verification",
        html:
          `<a href='${
            process.env.APP_BASE_URL || "http://localhost:4000"
          }/auth/verification/` +
          token +
          "'><h1>Click here to verify your email for free</h1></a>",
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (!err) {
          console.log("Sent");
          res.send("ok");
          console.log("Info: ", info);
        } else {
          console.log("Could not send email");
          res.sendStatus(500);
          console.log("Transporter Error: ", err);
        }
      });
    } else {
      res.status(500).send();
    }
  });
});

router.get("/verification/:token", (req, res) => {
  let decoded = verify(req.params.token);
  console.log(decoded);
  if (decoded) {
    const user = new UserModel(decoded);
    user.save((err, doc) => {
      res.set("Content-Type", "text/html");
      if (!err) {
        console.log(doc);
        res.send("<h1>EMAIL VERIFIED. YOU CAN NOW LOGIN</h1>");
      } else if(err.code===11000) {
        res.send("<h1>ERROR. This email is already registered</h1>");
      } else {
        console.log(err);
        res.send("<h1>ERROR. Please make sure everything is fine at your end and try again</h1>");
      }
    });
  } else {
    res.status(404).send();
  }
});

router.post("/login", (req, res) => {
  UserModel.findOne({ email: req.body.email }, (err, doc) => {
    if (!err) {
      bcrypt.compare(req.body.password, doc.password, (err, same) => {
        if (!err) {
          if (same) {
            let user = doc.toObject();
            delete user.password;
            const token = jwt.sign(user, secretKey);
            res.send(token);
          } else {
            res.status(400).send();
          }
        }
      });
    }
  });
});

router.patch("/notificationTokens", (req, res) => {
  const decoded = verify(req.headers["x-auth-token"]);
  if (!decoded) {
    return res.status(400).send();
  }
  UserModel.updateOne(
    { email: decoded.email },
    { expoPushToken: req.body.pushToken },
    (err, raw) => {
      if (!err) {
        console.log(raw);
        res.send();
      } else {
        console.log(err);
        res.status(404).send();
      }
    }
  );
});

router.post("/sendNotification", (req, res) => {
  const decoded = verify(req.headers["x-auth-token"]);
  if (!decoded) {
    return res.status(400).send();
  }
  UserModel.findOne({ _id: req.body.receiver }, (err, doc) => {
    if (!err) {
      try {
        sendNotification(req.body.message, doc.expoPushToken, decoded.username);
        res.send();
      } catch (error) {
        console.log(error);
        res.status(401).send();
      }
    } else {
      console.log(err);
      res.status(404).send();
    }
  });
});

router.post("/deleteExpoToken", (req, res) => {
  console.log(req.body);
  UserModel.updateOne(
    { _id: req.body.userId },
    { $unset: { expoPushToken: 1 } },
    (err, raw) => {
      if (!err) {
        res.send(raw);
      } else {
        console.log(err, "Token not deleted");
        res.status(500).send();
      }
    }
  );
});

module.exports = router;
