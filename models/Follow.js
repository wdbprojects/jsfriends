const usersCollection = require("../db").db().collection("users");
const followsCollection = require("../db").db().collection("follows");
const ObjectID = require("mongodb").ObjectId;
const User = require("./User");

/* CONSTRUCTOR */
let Follow = function (followedUsername, authorId) {
  this.followedUsername = followedUsername;
  this.authorId = authorId;
  this.errors = [];
};

/* CLEAN UP */
Follow.prototype.cleanUp = function () {
  if (typeof this.followedUsername !== "string") {
    this.followedUsername = "";
  }
};

/* VALIDATE */
Follow.prototype.validate = async function (action) {
  // followed username must exist in DB
  let followedAccount = await usersCollection.findOne({
    username: this.followedUsername,
  });
  if (followedAccount) {
    this.followedId = followedAccount._id;
  } else {
    this.errors.push("You can't follow a user that does not exist");
  }
  let doesFollowAlreadyExists = await followsCollection.findOne({
    followedId: this.followedId,
    authorId: new ObjectID(this.authorId),
  });
  if (action === "create") {
    if (doesFollowAlreadyExists) {
      this.errors.push("You are already following this user");
    }
  }
  if (action === "destroy") {
    if (!doesFollowAlreadyExists) {
      this.errors.push("You can't stop following someone you do not follow");
    }
  }
  // should not be able to follow yourself
  if (this.followedId.equals(this.authorId)) {
    this.errors.push("You can't follow yourself");
  }
};

/* ACTION: CREATE */
Follow.prototype.create = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    await this.validate("create");
    if (!this.errors.length) {
      await followsCollection.insertOne({
        followedId: this.followedId,
        authorId: new ObjectID(this.authorId),
      });
      resolve();
    } else {
      reject(this.errors);
    }
  });
};

/* IS VISITOR FOLLOWING */
Follow.isVisitorFollowing = async function (followedId, visitorId) {
  let followDoc = await followsCollection.findOne({
    followedId: followedId,
    authorId: new ObjectID(visitorId),
  });
  if (followDoc) {
    return true;
  } else {
    return false;
  }
};

/* ACTION: DESTROY */
Follow.prototype.destroy = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    await this.validate("destroy");
    if (!this.errors.length) {
      await followsCollection.deleteOne({
        followedId: this.followedId,
        authorId: new ObjectID(this.authorId),
      });
      resolve();
    } else {
      reject(this.errors);
    }
  });
};

/* GET FOLLOWERS BY ID */
Follow.getFollowersById = function (id) {
  return new Promise(async (resolve, reject) => {
    try {
      let followers = await followsCollection
        .aggregate([
          { $match: { followedId: id } },
          {
            $lookup: {
              from: "users",
              localField: "authorId",
              foreignField: "_id",
              as: "userDoc",
            },
          },
          {
            $project: {
              username: { $arrayElemAt: ["$userDoc.username", 0] },
              email: { $arrayElemAt: ["$userDoc.email", 0] },
            },
          },
        ])
        .toArray();
      followers = followers.map((follower) => {
        let user = new User(follower, true);
        return {
          username: follower.username,
          avatar: user.avatar,
        };
      });
      resolve(followers);
    } catch {
      reject();
    }
  });
};

/* GET FOLLOWING BY ID */
Follow.getFollowingById = function (id) {
  return new Promise(async (resolve, reject) => {
    try {
      let following = await followsCollection
        .aggregate([
          { $match: { authorId: id } },
          {
            $lookup: {
              from: "users",
              localField: "followedId",
              foreignField: "_id",
              as: "userDoc",
            },
          },
          {
            $project: {
              username: { $arrayElemAt: ["$userDoc.username", 0] },
              email: { $arrayElemAt: ["$userDoc.email", 0] },
            },
          },
        ])
        .toArray();
      following = following.map((followingPerson) => {
        let user = new User(followingPerson, true);
        return {
          username: followingPerson.username,
          avatar: user.avatar,
        };
      });
      resolve(following);
    } catch {
      reject();
    }
  });
};

/* COUNT FOLLOWERS BY ID */
Follow.countFollowersById = function (id) {
  return new Promise(async (resolve, reject) => {
    let followersCount = await followsCollection.countDocuments({
      followedId: id,
    });
    resolve(followersCount);
  });
};

/* COUNT FOLLOWING BY ID */
Follow.countFollowingById = function (id) {
  return new Promise(async (resolve, reject) => {
    let followingCount = await followsCollection.countDocuments({
      authorId: id,
    });
    resolve(followingCount);
  });
};

module.exports = Follow;
