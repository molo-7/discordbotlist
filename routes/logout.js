const router = require("express").Router();

const { logout } = require("../controllers/authentication");
const { forUsers: usersGaurd } = require("./guards/auth.gaurd");

router.all("/", usersGaurd, logout);

module.exports = router;
