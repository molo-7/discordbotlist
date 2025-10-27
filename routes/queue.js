const router = require("express").Router();

const { setRenderOptions } = require("../controllers/authentication");

const { renderQueue } = require("../controllers/queue");

router.get("/", setRenderOptions, renderQueue);

module.exports = router;
