module.exports = {
  forUsers(req, res, next) {
    req.session.userId ? next() : res.redirect("/login");
  },
  forAdmins(req, res, next) {
    req.session.isAdmin ? next() : res.status(400).render("404");
  },
};
