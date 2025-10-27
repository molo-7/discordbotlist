const { TAGS } = require("../config.json");
const { findByTag, findByUserameOrAbout, findByTagAndUserameOrAbout } = require("../models/bot.model");
const limit = 6;

module.exports.renderPage = async (req, res) => {
    let data = req.renderOptions;
    let {tag, q: searchQuery, page} = req.query;
    page = (!isNaN(Number(page)) && Number(page) <= 6) ? Number(page) : 1;
    let results;
    if (tag && searchQuery) {
        results = await findByTagAndUserameOrAbout(tag, searchQuery, limit, page);
    } else if (tag) {
        results = await findByTag(tag, limit, page);
    } else if (searchQuery) {
        results = await findByUserameOrAbout(searchQuery, limit, page);
    }
    data.results = results?.bots;
    data.tags = TAGS.sort();
    data.tag = tag;
    data.q = searchQuery;
    data.pages = results?.totalSize && results.totalSize > limit ? { current: page, available: Math.ceil(results.totalSize / limit) > 6 ? 6 : Math.ceil(results.totalSize / limit) } : null;
    res.render("explore", data);
}