const router = require("express").Router();
const path = require("path");
const multer = require("multer");
const mongo = require("mongoose");
const jwt = require("jsonwebtoken");
const config = require("config");
const uploadToFireBaseStorage = require("../firestorage");

const PostModel = mongo.model("Post");
const secretKey = config.get("jwtPrivateKey");

const storage = multer.diskStorage({
  destination: "pics/",
  filename: (req, file, cb) => {
    const parts = file.mimetype.split("/");
    cb(null, `img${Date.now().toString()}.${parts[1]}`);
  },
});

const fileFilter = (req, file, cb) => {
  const parts = file.mimetype.split("/");
  if (parts[0] === "image" && verify(req.headers["x-auth-token"])) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({ storage, fileFilter });

const verify = (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (error) {
    decoded = false;
  }
  return decoded;
};

// router.get("/images/:title", (req, res) => {
//   res.sendFile(path.join(__dirname, "../pics/", req.params.title));
// });

router.get("/", (req, res) => {
  if (!verify(req.headers["x-auth-token"])) {
    return res.status(400).send();
  }
  PostModel.find().lean().populate("poster", "-__v -password")
  .exec((err, docs) => {
    if (!err) {
      res.send(docs);
    } else {
      res.status(404).send();
      console.log(err);
    }
  });
});

router.post("/", upload.array("images"), async(req, res) => {
  if (!verify(req.headers["x-auth-token"])) {
    return res.status(400).send();
  }
  const post = new PostModel();
  Object.keys(req.body).forEach((key) => {
    post[key] = req.body[key];
  });
  let imageLinkArray = [];
  if (req?.files.length) {
    for (let file of req.files) {
      const url = await uploadToFireBaseStorage(
        `./pics/${file.filename}`,
        file.mimetype,
        `pics/${file.filename}`
      );
      imageLinkArray.push(url)
    }

    console.log("ImageLinkArray: ", imageLinkArray);
    if(imageLinkArray?.length){
      post["images"] = imageLinkArray;
      post.save((err, doc) => {
        err?
        res.sendStatus(400):
        res.send(doc);
      });
    }
  }

  // post["images"] = req.files.map(
  //   (image) => `http://192.168.43.233:4000/listings/images/${image.filename}`
  //   );
  
});

router.delete("/:id", (req, res) => {
  if (!verify(req.headers["x-auth-token"])) {
    return res.status(400).send();
  }
  PostModel.deleteOne({_id: req.params.id}, (err, info)=>{
    if(!err){
      res.sendStatus(200)
      console.log(info);
    }else{
      res.sendStatus(500)
      console.log(err);
    }
  })
});

router.put("/", upload.array("images"), async(req, res) => {
  if (!verify(req.headers["x-auth-token"])) {
    return res.status(400).send();
  }
  let listing = {...req.body};
  let imageLinkArray = [];
  if (req?.files.length) {
    for (let file of req.files) {
      const url = await uploadToFireBaseStorage(
        `./pics/${file.filename}`,
        file.mimetype,
        `pics/${file.filename}`
      );
      imageLinkArray.push(url)
    }
    
    console.log("ImageLinkArray: ", imageLinkArray);
      if(imageLinkArray?.length){
        listing["images"] = imageLinkArray;
      }
  }
  console.log(listing);
  PostModel.updateOne({_id: req.body._id}, listing, (err,raw)=>{
    if(!err){
      res.sendStatus(200)
      console.log(raw);
    }else{
      res.sendStatus(500)
      console.log(err);
    }
  })
  
});

router.get("/:posterId", (req, res) => {
  if (!verify(req.headers["x-auth-token"])) {
    return res.status(400).send();
  }
  PostModel.find({poster: req.params.posterId}).lean()
  .exec((err, docs) => {
    if (!err) {
      res.send(docs);
    } else {
      res.status(404).send();
      console.log(err);
    }
  });
});

module.exports = router;
