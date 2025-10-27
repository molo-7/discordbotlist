// users' profiles router
const router = require("express").Router();
const bodyParser = require("body-parser").urlencoded({ extended: true });

const { setRenderOptions } = require("../controllers/authentication");
const { forUsers } = require("./guards/auth.gaurd");
const { renderPage, findBot, submit } = require("../controllers/submissions");

router.get("/", forUsers, setRenderOptions, renderPage);
router.post("/", forUsers, bodyParser, findBot, submit);

module.exports = router;
