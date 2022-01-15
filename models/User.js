const bcrypt = require("bcryptjs");
const usersCollection = require("../db").db().collection("users");
const validator = require("validator");
const md5 = require("md5");

/* CONSTRUCTOR */
let User = function (data, getAvatar) {
  this.data = data;
  this.errors = [];
  if (getAvatar === undefined) {
    getAvatar = false;
  }
  if (getAvatar) {
    this.getAvatar();
  }
};

/* CLEAN UP */
User.prototype.cleanUp = function () {
  if (typeof this.data.username != "string") {
    this.data.username = "";
  }
  if (typeof this.data.email != "string") {
    this.data.email = "";
  }
  if (typeof this.data.password != "string") {
    this.data.password = "";
  }
  this.data = {
    username: this.data.username.trim().toLowerCase(),
    email: this.data.email.trim().toLowerCase(),
    password: this.data.password,
  };
};

/* VALIDATE */
User.prototype.validate = function () {
  return new Promise(async (resolve, reject) => {
    if (this.data.username == "") {
      this.errors.push("You must provide a username");
    }
    if (
      this.data.username != "" &&
      !validator.isAlphanumeric(this.data.username)
    ) {
      this.errors.push("Username can only contain letters and numbers!");
    }
    if (this.data.username.length > 0 && this.data.username.length < 3) {
      this.errors.push("Username must be at least 3 characters!");
    }
    if (this.data.username.length > 15) {
      this.errors.push("Username cannot exceed 15 characters");
    }
    // check if username exists
    if (
      this.data.username.length > 2 &&
      this.data.username.length < 31 &&
      validator.isAlphanumeric(this.data.username)
    ) {
      let usernameExists = await usersCollection.findOne({
        username: this.data.username,
      });
      if (usernameExists) {
        this.errors.push("That username is already taken!");
      }
    }
    /* EMAIL */
    if (!validator.isEmail(this.data.email)) {
      this.errors.push("You must provide a valid email");
    }
    // check if email exists
    if (validator.isEmail(this.data.email)) {
      let emailExists = await usersCollection.findOne({
        email: this.data.email,
      });
      if (emailExists) {
        this.errors.push("That email is already taken!");
      }
    }
    /* PASSWORD */
    if (this.data.password === "") {
      this.errors.push("You must provide a password");
    }
    if (this.data.password.length > 0 && this.data.password.length < 8) {
      this.errors.push("Passwords must be at least 8 characters!");
    }
    if (this.data.password.length > 25) {
      this.errors.push("Passwords cannot exceed 25 characters");
    }
    resolve();
  });
};

/* LOGIN */
User.prototype.login = function () {
  return new Promise((resolve, reject) => {
    this.cleanUp();
    usersCollection
      .findOne({
        username: this.data.username,
      })
      .then((attemptedUser) => {
        if (
          attemptedUser &&
          bcrypt.compareSync(this.data.password, attemptedUser.password)
        ) {
          this.data = attemptedUser;
          this.getAvatar();
          resolve("Congrats");
        } else {
          reject("Invalid username/password, try again");
        }
      })
      .catch((err) => {
        reject("Please try again later");
      });
  });
};

/* REGISTER */
User.prototype.register = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    this.validate();
    if (!this.errors.length) {
      let salt = bcrypt.genSaltSync(10);
      this.data.password = bcrypt.hashSync(this.data.password, salt);
      await usersCollection.insertOne(this.data);
      this.getAvatar();
      resolve();
    } else {
      reject(this.errors);
    }
  });
};

/* GET AVATAR */
User.prototype.getAvatar = function () {
  this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`;
};

/* FIND BY USERNAME */
User.findByUsername = (username) => {
  return new Promise((resolve, reject) => {
    if (typeof username !== "string") {
      reject();
      return;
    }
    usersCollection
      .findOne({ username: username })
      .then((userDoc) => {
        if (userDoc) {
          userDoc = new User(userDoc, true);
          userDoc = {
            _id: userDoc.data._id,
            username: userDoc.data.username,
            avatar: userDoc.avatar,
          };
          resolve(userDoc);
        } else {
          reject();
        }
      })
      .catch(() => {
        reject();
      });
  });

  /* return new Promise((resolve, reject) => {
    if (typeof username != "string") {
      reject();
      return;
    }
    usersCollection
      .findOne({ username: username })
      .then((userDoc) => {
        if (userDoc) {
          userDoc = new User(userDoc, true);
          userDoc = {
            _id: userDoc.data._id,
            username: userDoc.data.username,
            avatar: userDoc.avatar,
          };
          resolve(userDoc);
        } else {
          reject();
        }
      })
      .catch(() => {
        reject();
      });
  }); */
};

/* DOES EMAIL EXIST */
User.doesEmailExist = function (email) {
  return new Promise(async (resolve, reject) => {
    if (typeof email != "string") {
      resolve(false);
      return;
    }
    let user = await usersCollection.findOne({ email: email });
    if (user) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
};

module.exports = User;
