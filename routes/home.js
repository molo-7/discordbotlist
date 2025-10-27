const router = require("express").Router();

const { setRenderOptions } = require("../controllers/authentication");
const controller = require("../controllers/home");

router.get("/", setRenderOptions, controller)

module.exports = router;