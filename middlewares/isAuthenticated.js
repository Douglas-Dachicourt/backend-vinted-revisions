const mongoose = require("mongoose");

const User = require("../Models/User");

const isAuthenticated = async (req, res, next) => {
  if (req.headers.authorization) {
    const user = await User.findOne({
      token: req.headers.authorization.replace("Bearer ", ""),
    });
    if (!user) {
      res.status(404).json({ message: "Unauthorized" });
      // console.log(user.token);
    } else {
      req.user = user;
      return next();
    }
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = isAuthenticated;
