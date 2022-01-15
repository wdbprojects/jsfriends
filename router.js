const express = require("express");
const router = express.Router();
const userController = require("./controllers/userController");
const postController = require("./controllers/postController");
const followController = require("./controllers/followController");

/* USERS ROUTES*/
router.get("/", userController.home);
router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.post("/doesUsernameExist", userController.doesUsernameExist);
router.post("/doesEmailExist", userController.doesEmailExist);

/* PROFILE ROUTES */
router.get(
  "/profile/:username",
  userController.ifUserExists,
  userController.sharedProfileData,
  userController.profilePostsScreen,
);
router.get(
  "/profile/:username/followers",
  userController.ifUserExists,
  userController.sharedProfileData,
  userController.profileFollowersScreen,
);
router.get(
  "/profile/:username/following",
  userController.ifUserExists,
  userController.sharedProfileData,
  userController.profileFollowingScreen,
);

/* POSTS ROUTES*/
router.get(
  "/create-post",
  userController.mustBeLoggedIn,
  postController.viewCreateScreen,
);

router.get("/post/:id", postController.viewSingle);
router.get(
  "/post/:id/edit",
  userController.mustBeLoggedIn,
  postController.viewEditScreen,
);
router.post(
  "/create-post",
  userController.mustBeLoggedIn,
  postController.createPost,
);
router.post(
  "/post/:id/edit",
  userController.mustBeLoggedIn,
  postController.editPost,
);
router.post(
  "/post/:id/delete",
  userController.mustBeLoggedIn,
  postController.deletePost,
);

router.post("/search", postController.search);

/* FOLLOW ROUTES */
router.post(
  "/addFollow/:username",
  userController.mustBeLoggedIn,
  followController.addFollow,
);
router.post(
  "/removeFollow/:username",
  userController.mustBeLoggedIn,
  followController.removeFollow,
);

module.exports = router;
