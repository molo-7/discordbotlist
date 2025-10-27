const router = require("express").Router();

router.get("/", (req, res) =>
  res.redirect(require("../config.json").DISCORD_INVITE)
);

module.exports = router;
