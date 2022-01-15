const { reset } = require("nodemon");
const Post = require("../models/Post");

/* CREATE POST SCREEN */
exports.viewCreateScreen = (req, res) => {
  res.render("create-post");
};

/* CREATE POST */
exports.createPost = async function (req, res) {
  let post = new Post(req.body, req.session.user._id);
  try {
    const newId = await post.createPost();
    req.flash("success", "New post successfully created");
    req.session.save(() => {
      res.redirect(`/post/${newId}`);
    });
  } catch (errors) {
    errors.forEach((error) => {
      req.flash("errors", error);
      req.session.save(() => {
        res.redirect("/create-post");
      });
    });
  }
};

/* API CREATE POST */
exports.apiCreatePost = async function (req, res) {
  let post = new Post(req.body, req.apiUser._id);
  try {
    const newId = await post.create();
    res.json("Congrats");
  } catch (errors) {
    res.json(errors);
  }
};

/* VIEW SINGLE */
exports.viewSingle = async function (req, res) {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId);
    res.render("single-post-screen", {
      post: post,
      title: post.title
    });
  } catch {
    res.render("404");
  }
};

/* VIEW EDIT SCREEN */
exports.viewEditScreen = async (req, res) => {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId);
    if (post.postAuthor) {
      res.render("edit-post", {
        post: post,
      });
    } else {
      req.flash("errors", "You don't have permission to perform that action");
      req.session.save(() => {
        res.redirect("/");
      });
    }
  } catch (err) {
    res.render("404");
  }
};

/* EDIT POST */
exports.editPost = async (req, res) => {
  let post = new Post(req.body, req.visitorId, req.params.id);
  try {
    const status = await post.update();
    if (status === "success") {
      req.flash("success", "Post successfully updated");
      req.session.save(() => {
        res.redirect(`/post/${req.params.id}/edit`);
      });
    } else {
      post.errors.map((error) => {
        return req.flash("errors", error);
      });
      req.session.save(() => {
        res.redirect(`/post/${req.params.id}/edit`);
      });
    }
  } catch (errors) {
    req.flash("errors", "You do not have permission to perform that action");
    req.session.save(() => {
      res.redirect("/");
    });
  }
};

/* DELETE POST */
exports.deletePost = async (req, res) => {
  try {
    await Post.delete(req.params.id, req.visitorId);
    req.flash("success", "Post successfully deleted.");
    req.session.save(() => {
      res.redirect(`/profile/${req.session.user.username}`);
    });
  } catch (error) {
    req.flash("errors", "You do not have permission to perform that action");
    req.session.save(() => {
      res.redirect("/");
    });
  }
};

/* API DELETE POST */
exports.apiDeletePost = (req, res) => {
  Post.delete(req.params.id, req.apiUser._id)
    .then(() => {
      res.json("Successfully deleted post");
    })
    .catch(() => {
      res.json("You don't have permission to perform that action");
    });
};

/* SEARCH */
exports.search = async (req, res) => {
  try {
    const posts = await Post.search(req.body.searchTerm);
    console.log("send from js front end!!");
    res.json(posts);
  } catch (error) {
    res.json([]);
  }
};
