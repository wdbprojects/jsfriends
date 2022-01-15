const Follow = require("../models/Follow");

/* ADD FOLLOW */
exports.addFollow = (req, res) => {
  let follow = new Follow(req.params.username, req.visitorId);
  follow
    .create()
    .then(() => {
      req.flash("success", `Successfully followed ${req.params.username}`);
      req.session.save(() => {
        res.redirect(`/profile/${req.params.username}`);
      });
    })
    .catch((errors) => {
      errors.forEach((error) => {
        req.flash("errors", error);
      });
      req.session.save(() => {
        res.redirect("/");
      });
    });
};

/* REMOVE FOLLOW */
exports.removeFollow = (req, res) => {
  let follow = new Follow(req.params.username, req.visitorId);
  follow
    .destroy()
    .then(() => {
      req.flash(
        "success",
        `Successfully stopped following ${req.params.username}`,
      );
      req.session.save(() => {
        res.redirect(`/profile/${req.params.username}`);
      });
    })
    .catch(() => {
      errors.forEach((error) => {
        req.flash("errors", error);
      });
      req.session.save(() => {
        res.redirect("/");
      });
    });
};
