const router = require("express").Router();
const { renderPage } = require("../controllers/explore");
const { setRenderOptions } = require("../controllers/authentication");

router.get("/", setRenderOptions, renderPage);

module.exports = router;