const router = require("express").Router();

const {
  redirectToOAuth2,
  getAccessToken,
  login,
} = require("../controllers/authentication");

router.get(
  "/",
  (req, res, next) =>
    req.session.userId ? res.redirect("/logout?redir=true") : next(),
  redirectToOAuth2
);

router.get("/cb", getAccessToken, login);

module.exports = router;
