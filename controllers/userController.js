const User = require("../models/User");
const Post = require("../models/Post");
const Follow = require("../models/Follow");
const jwt = require("jsonwebtoken");

/* API GET POSTS BY USERNAME */
exports.apiGetPostsByUsername = async function (req, res) {
  try {
    let authorDoc = await User.findByUsername(req.params.username);
    let posts = Post.findByAuthorId(authorDoc._id);
    res.json(posts);
  } catch {
    res.json("Invalid user requested");
  }
};

/* API MUST BE LOGGED IN */
exports.apiMustBeLoggedIn = function (req, res, next) {
  try {
    req.apiUser = jwt.verify(req.body.token, process.env.JWTSECRET);
    next();
  } catch {
    res.json("You must provide a valid token");
  }
};

/* DOES USERNAME EXISTS */
exports.doesUsernameExist = function (req, res) {
  User.findByUsername(req.body.username)
    .then(() => {
      res.json(true);
    })
    .catch(() => {
      res.json(false);
    });
};

/* DOES EMAIL EXISTS */
exports.doesEmailExist = async function (req, res) {
  let emailBool = await User.doesEmailExist(req.body.email);
  res.json(emailBool);
};

/* SHARED PROFILE DATA */
exports.sharedProfileData = async function (req, res, next) {
  let isVisitorsProfile = false;
  let isFollowing = false;
  if (req.session.user) {
    isVisitorsProfile = req.profileUser._id.equals(req.session.user._id);
    isFollowing = await Follow.isVisitorFollowing(
      req.profileUser._id,
      req.visitorId,
    );
  }

  req.isVisitorsProfile = isVisitorsProfile;
  req.isFollowing = isFollowing;

  // retrieve post, follower, and following counts

  let postsCountPromise = Post.countPostsByAuthor(req.profileUser._id);
  let followersCountPromise = Follow.countFollowersById(req.profileUser._id);
  let followingCountPromise = Follow.countFollowingById(req.profileUser._id);

  let [postsCount, followersCount, followingCount] = await Promise.all([
    postsCountPromise,
    followersCountPromise,
    followingCountPromise,
  ]);
  req.postsCount = postsCount;
  req.followersCount = followersCount;
  req.followingCount = followingCount;

  next();
};

/* MUST BE LOGGED IN */
exports.mustBeLoggedIn = function (req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.flash("errors", "You must be logged in to perform that action");
    req.session.save(function () {
      res.redirect("/");
    });
  }
};

/* LOGIN */
exports.login = function (req, res) {
  let user = new User(req.body);
  user
    .login()
    .then(function (result) {
      req.session.user = {
        avatar: user.avatar,
        username: user.data.username,
        _id: user.data._id,
      };
      req.session.save(function () {
        res.redirect("/");
      });
    })
    .catch(function (err) {
      req.flash("errors", err);
      req.session.save(() => {
        res.redirect("/");
      });
    });
};

/* API LOGIN */
exports.apiLogin = function (req, res) {
  let user = new User(req.body);
  user
    .login()
    .then(function (result) {
      res.json(
        jwt.sign(
          {
            _id: user.data._id,
          },
          process.env.JWTSECRET,
          {
            expiresIn: "7d",
          },
        ),
      );
    })
    .catch(function (err) {
      res.json("incorrect username/password");
    });
};

/* LOGOUT */
exports.logout = (req, res) => {
  req.session.destroy(function () {
    res.redirect("/");
  });
};

/* REGISTER */
exports.register = function (req, res) {
  let user = new User(req.body);
  user
    .register()
    .then(() => {
      req.session.user = {
        username: user.data.username,
        avatar: user.avatar,
        _id: user.data._id,
      };
      req.session.save(function () {
        res.redirect("/");
      });
    })
    .catch((regErrors) => {
      regErrors.forEach(function (error) {
        req.flash("regErrors", error);
      });
      req.session.save(function () {
        res.redirect("/");
      });
    });
};

/* HOME */
exports.home = async function (req, res) {
  if (req.session.user) {
    // fetch feed of posts for current users
    let posts = await Post.getFeed(req.session.user._id);
    res.render("home-dashboard", {
      posts: posts,
    });
  } else {
    res.render("home-guest", {
      regErrors: req.flash("regErrors"),
    });
  }
};

/* IF USER EXISTS */
exports.ifUserExists = (req, res, next) => {
  User.findByUsername(req.params.username)
    .then((userDocument) => {
      req.profileUser = userDocument;
      next();
    })
    .catch(() => {
      res.render("404");
    });
};

/* PROFILE POSTS SCREEN */
exports.profilePostsScreen = (req, res) => {
  // request post model for posts by author id
  Post.findByAuthorId(req.profileUser._id)
    .then((posts) => {
      res.render("profile", {
        title: `Profile for: ${req.profileUser.username}`,
        currentPage: "posts",
        posts: posts,
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar,
        isFollowing: req.isFollowing,
        isVisitorsProfile: req.isVisitorsProfile,
        counts: {
          postsCount: req.postsCount,
          followersCount: req.followersCount,
          followingCount: req.followingCount,
        },
      });
    })
    .catch(() => {
      res.render("404");
    });
};

/* PROFILE FOLLOWERS SCREEN */
exports.profileFollowersScreen = async function (req, res) {
  try {
    let followers = await Follow.getFollowersById(req.profileUser._id);
    res.render("profile-followers", {
      currentPage: "followers",
      followers: followers,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile,
      counts: {
        postsCount: req.postsCount,
        followersCount: req.followersCount,
        followingCount: req.followingCount,
      },
    });
  } catch {
    res.render("404");
  }
};

/* PROFILE FOLLOWING SCREEN */
exports.profileFollowingScreen = async function (req, res) {
  try {
    let following = await Follow.getFollowingById(req.profileUser._id);
    res.render("profile-following", {
      currentPage: "following",
      following: following,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile,
      counts: {
        postsCount: req.postsCount,
        followersCount: req.followersCount,
        followingCount: req.followingCount,
      },
    });
  } catch {
    res.render("404");
  }
};
