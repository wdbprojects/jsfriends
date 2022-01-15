const postsCollection = require("../db").db().collection("posts");
const followsCollection = require("../db").db().collection("follows");
const ObjectID = require("mongodb").ObjectId;
const User = require("./User");
const sanitizeHTML = require("sanitize-html");

postsCollection.createIndex({ title: "text", body: "text" });

let Post = function (data, userid, requestedPostId) {
  this.data = data;
  this.errors = [];
  this.userid = userid;
  this.requestedPostId = requestedPostId;
};

Post.prototype.cleanUp = function () {
  if (typeof this.data.title != "string") {
    this.data.title = "";
  }
  if (typeof this.data.body != "string") {
    this.data.body = "";
  }

  // get rid of any bogus properties
  this.data = {
    title: sanitizeHTML(this.data.title.trim(), {
      allowedTags: [],
      allowedAttributes: {},
    }),
    body: sanitizeHTML(this.data.body.trim(), {
      allowedTags: [],
      allowedAttributes: {},
    }),
    createdDate: new Date(),
    author: ObjectID(this.userid),
  };
};

Post.prototype.validate = function () {
  if (this.data.title == "") {
    this.errors.push("You must provide a title.");
  }
  if (this.data.body == "") {
    this.errors.push("You must provide post content.");
  }
};

Post.prototype.createPost = async function () {
  this.cleanUp();
  this.validate();
  if (!this.errors.length) {
    // save post into database
    try {
      const info = await postsCollection.insertOne(this.data);
      return info.insertedId;
    } catch (err) {
      this.errors.push("Please try again later.");
      throw this.errors;
    }
  } else {
    throw this.errors;
  }
};

Post.prototype.update = function () {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.findSingleById(this.requestedPostId, this.userid);
      if (post.postAuthor) {
        // actually update the db
        let status = await this.actuallyUpdate();
        resolve(status);
      } else {
        reject();
      }
    } catch {
      reject();
    }
  });
};

Post.prototype.actuallyUpdate = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    this.validate();
    if (!this.errors.length) {
      await postsCollection.findOneAndUpdate(
        { _id: new ObjectID(this.requestedPostId) },
        { $set: { title: this.data.title, body: this.data.body } },
      );
      resolve("success");
    } else {
      resolve("failure");
    }
  });
};

Post.reusablePostQuery = (
  uniqueOperations,
  visitorId,
  finalOperations = [],
) => {
  return new Promise(async function (resolve, reject) {
    let aggOperations = uniqueOperations
      .concat([
        {
          $lookup: {
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "authorDocument",
          },
        },
        {
          $project: {
            title: 1,
            body: 1,
            createdDate: 1,
            authorId: "$author",
            author: { $arrayElemAt: ["$authorDocument", 0] },
          },
        },
      ])
      .concat(finalOperations);
    let posts = await postsCollection.aggregate(aggOperations).toArray();
    // clean up author property in each post object
    posts = posts.map((post) => {
      post.isVisitorOwner = post.authorId.equals(visitorId);
      return {
        id: post._id,
        postAuthor: post.isVisitorOwner,
        title: post.title,
        body: post.body,
        createdDate: post.createdDate,
        username: post.author.username,
        email: post.author.email,
        avatar: new User(post.author, true).avatar,
      };
    });
    //console.log(posts);
    resolve(posts);
  });
};

Post.findSingleById = (id, visitorId) => {
  return new Promise(async function (resolve, reject) {
    if (typeof id !== "string" || !ObjectID.isValid(id)) {
      reject();
      return;
    }
    let posts = await Post.reusablePostQuery(
      [{ $match: { _id: new ObjectID(id) } }],
      visitorId,
    );
    if (posts.length) {
      //console.log(posts[0]);
      resolve(posts[0]);
    } else {
      reject();
    }
  });
};

Post.findByAuthorId = (authorId) => {
  return Post.reusablePostQuery([{ $match: { author: authorId } }], undefined, [
    { $sort: { createdDate: -1 } },
  ]);
};

Post.delete = (postIdToDelete, currentUserId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.findSingleById(postIdToDelete, currentUserId);
      if (post.postAuthor) {
        await postsCollection.deleteOne({ _id: new ObjectID(postIdToDelete) });
        resolve();
      } else {
        reject();
      }
    } catch {
      reject();
    }
  });
};

Post.search = (searchTerm) => {
  return new Promise(async (resolve, reject) => {
    if (typeof searchTerm == "string") {
      let posts = await Post.reusablePostQuery(
        [{ $match: { $text: { $search: searchTerm } } }],
        [{ $sort: { score: { $meta: "textScore" } } }],
      );
      resolve(posts);
    } else {
      reject();
    }
  });
};

Post.countPostsByAuthor = function (id) {
  return new Promise(async (resolve, reject) => {
    let postCount = await postsCollection.countDocuments({ author: id });
    resolve(postCount);
  });
};

Post.getFeed = async function (id) {
  // create an array of the user ids that the current user follows
  let followedUsers = await followsCollection
    .find({ authorId: new ObjectID(id) })
    .toArray();
  followedUsers = followedUsers.map(function (followDoc) {
    return followDoc.followedId;
  });

  // look for posts where the author is in the above array of followed users
  return Post.reusablePostQuery([
    { $match: { author: { $in: followedUsers } } },
    { $sort: { createdDate: -1 } },
  ]);
};

module.exports = Post;