const Users = require("../Models/newUserModel");
const codeGen = require("../Dependencies/codeGenerator");
const mailer = require("../Dependencies/mailer");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const res = require("express/lib/response");
require("dotenv").config();

// Login

exports.login = async (req, res, next) => {
  // Data
  const email = req.body.email;
  const password = req.body.password;

  try {
    const user = await Users.findOne({ email: email });
    if (!user) {
      res.status(400).send("Email or password is incorrect.");
      return;
    }
    if (user) {
      const validPasswords = await bcrypt.compare(password, user.password);
      if (!validPasswords) {
        return res.status(400).send("Email or password is incorrect.");
      }
      if (validPasswords) {
        const code = codeGen("Num", 8);
        mailer(email, "Simple Login ", `This is your code ${code}`);

        try {
          const addCode = await Users.findOneAndUpdate(
            { email: email },
            { code: code }
          );
          if (addCode) {
            res.status(200).send({ result: "Code send", code: user.code });
          }
        } catch (err) {
          return res.status(500).send(err);
        }
      }
    }
  } catch (err) {
    return res.status(500).send(err);
  }
  next();
};
exports.codeVerif = async (req, res, next) => {
  // Taking the code from the user
  const email = req.body.email;
  const code = req.body.code;
  try {
    const user = await Users.findOne({ email: email });
    if (user) {
      if (user.code === code) {
        try {
          const JWT_KEY = process.env.JWT_KEY;
          const token = jwt.sign(
            { userId: user._id, userName: user.name },
            JWT_KEY
          );
          res
            .send({ result: "user loged in", user: user, token: token })
            .status(200);
        } catch (err) {
          res.send({ err }).status(500);
        }
      } else {
        return res.status(401).send({ err: "Faild To Login" });
      }
    }
  } catch (err) {
    res.status(500).send(err);
  }
  next();
};
