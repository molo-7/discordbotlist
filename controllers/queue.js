const { getQueue } = require("../models/queue.model");

module.exports.renderQueue = (req, res) => {
  let data = req.renderOptions;
  data.scrollTo = req.query.scrollTo ? req.query.scrollTo : "";
  getQueue().then((queue) => {
    data.queue = queue;
    res.render("queue", data);
  });
};
