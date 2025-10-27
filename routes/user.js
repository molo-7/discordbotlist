// users' profiles router
const router = require("express").Router();
const bodyParser = require("body-parser");

const { setRenderOptions } = require("../controllers/authentication");
const {
  getProfile,
  syncProfile,
  editProfile,
} = require("../controllers/profile");

router.get("/:userId", setRenderOptions, getProfile);
router.post("/:userId/sync", syncProfile);
router.post(
  "/:userId/edit",
  bodyParser.urlencoded({ extended: true }),
  editProfile
);

module.exports = router;
