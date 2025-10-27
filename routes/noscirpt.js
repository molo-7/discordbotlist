const router = require("express").Router();
const path = require("path");

router.get("/", (req, res) => {
  const separator = __dirname.includes("/") ? "/" : "\\";
  const dirname = __dirname.split(separator);
  res.sendFile(
    path.join(
      dirname.slice(0, dirname.length - 1).join(separator),
      "views",
      "noscript.html"
    )
  );
});

module.exports = router;
