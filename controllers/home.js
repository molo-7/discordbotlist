const { getTopVerifiedBots, getTopBots, getLastAddedBots } = require("../models/bot.model");

module.exports = async (req, res) => {
    let { renderOptions: renderData } = req;
    renderData.verifiedBots = await getTopVerifiedBots(5);
    renderData.topBots = await getTopBots(5);
    renderData.lastAddedBots = await getLastAddedBots(5);
    res.render("home", renderData);
}