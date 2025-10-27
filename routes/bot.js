const router = require("express").Router();

const bodyParser = require("body-parser").urlencoded({ extended: true });
const controller = require("../controllers/bots.js");
const { setRenderOptions } = require("../controllers/authentication");
const { forUsers, forAdmins } = require("./guards/auth.gaurd");

// new bot redirects to /addbot router
router.get("/new", (_, res) => res.redirect("/addbot"));

/* ----- actions ----- */
router.post("/actions/vote/:botId", forUsers, controller.upvoteBot);
router.get("/actions/sync/:botId", forUsers, controller.syncBot);
router.post("/actions/remove/:botId", forUsers, controller.removeBot);
router.post("/actions/edit/:botId", forUsers, bodyParser, controller.editBot)

router.post("/actions/approve/:botId", forAdmins, controller.approveBot);
router.post("/actions/reject/:botId", forAdmins, bodyParser, controller.rejectBot);
router.post("/actions/kick/:botId", forAdmins, controller.kickBot); // for website_founder

/* ----- render html ----- */

router.get("/:botId/vote", setRenderOptions, controller.renderVotePage);
router.get("/:botId/edit", setRenderOptions, controller.renderEditPage)
router.get("/:botId", setRenderOptions, controller.renderPage, controller.renderPageForSubmittersAndStaff);

module.exports = router;
