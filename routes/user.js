const express = require("express");
// const app = express();

const router = express.Router();

const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const convertToBase64 = require("../utils/ConvertToBase64");
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload");

const User = require("../Models/User");

// -------------------- SIGN UP PAGE ----------------------------- //

router.post("/user/signup", fileUpload(), async (req, res) => {
  const salt = uid2(16);
  const password = req.body.password;
  const hash = SHA256(password + salt).toString(encBase64);
  const token = uid2(16);

  try {
    const avatarToUpload = req.files.picture;
    const result = await cloudinary.uploader.upload(
      convertToBase64(avatarToUpload)
    );

    const newUser = new User({
      email: req.body.email,
      account: {
        username: req.body.username,
        avatar: result,
      },
      newsletter: req.body.newsletter,
      password: req.body.password,
      token: token,
      hash: hash,
      salt: salt,
    });
    console.log(newUser);

    const doublon = await User.findOne({ email: req.body.email });
    // console.log(doublon);

    //   si l'email en body est trouvée dans la base de donnée

    if (doublon) {
      return res.status(400).json({
        message: "An account is already in use with this email address",
      });
    }

    // si il n'y a pas de username envoyé en body

    if (!req.body.username) {
      return res
        .status(400)
        .json({ message: "a username is necessary to create an account" });
    }
    await newUser.save();
    res.status(201).json({
      _id: newUser._id,
      token: newUser.token,
      account: {
        username: newUser.account.username,
        avatar: newUser.account.avatar.secure_url,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ------------------------------------------------------- //

// ------------------------LOG IN PAGE ------------------- //

router.post("/user/login", async (req, res) => {
  try {
    const request = await User.findOne({ email: req.body.email });
    // console.log(request);
    const password2 = req.body.password;
    const salt2 = request.salt;
    const hash2 = request.hash;
    // console.log(hash2);
    // console.log(salt2);
    // console.log(password2);

    const newHash = SHA256(password2 + salt2).toString(encBase64);
    // console.log(newHash);

    if (newHash === hash2) {
      res.status(200).json({
        _id: request._id,
        token: request.token,
        account: {
          username: request.account.username,
          avatar: request.account.avatar.secure_url,
        },
      });
    } else {
      res.status(400).json({ message: "Your email or password are incorrect" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
