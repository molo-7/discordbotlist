const { OAuth2_URL, CLIENT_ID, CLIENT_SECRET } = process.env;
const { updateUser, createNewUser, getUser } = require("../models/user.model");
const fetch = require("node-fetch");
const accessTokenBase = "https://discord.com/api/oauth2/token";
const usersBase = "https://discordapp.com/api/users/@me";
const { ORIGIN } = require("../config.json");
const REDIRECT_ROUTE = "/login/cb";

module.exports.redirectToOAuth2 = (req, res) => res.redirect(OAuth2_URL); // redirect to discord OAuth2

// get access token from the code returned from discord OAuth2
module.exports.getAccessToken = (req, res, next) => {
  if (!req.query.code) {
    res.status(500).render("error", { isUser: Boolean(req.session.userId) });
    return;
  }
  const codeGrant = req.query.code;
  const params = new URLSearchParams();
  params.append("client_id", CLIENT_ID);
  params.append("client_secret", CLIENT_SECRET);
  params.append("grant_type", "authorization_code");
  params.append("code", codeGrant);
  params.append(
    "redirect_uri",
    `${ORIGIN}${REDIRECT_ROUTE}`
    );
  fetch(accessTokenBase, {
    method: "post",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  })
    .then((response) => response.json())
    .then((data) => {
      // return the accessData and run the next middleware (login)
      if (data.error) {
        res
          .status(500)
          .render("error", { isUser: Boolean(req.session.userId) });
        return;
      }
      req.accessData = data;
      next();
    });
};

module.exports.login = (req, res) => {
  // get user object with access token
  fetch(usersBase, {
    headers: {
      Authorization: `${req.accessData.token_type} ${req.accessData.access_token}`,
    },
  })
    .then((response) => response.json(), console.error)
    .then(async (user) => {
      const userDocument = await getUser(user.id);
      let data = {
        username: user.username,
        discriminator: user.discriminator,
        avatarURL: user.avatar
          ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp`
          : null,
        banner: user.banner
          ? `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.webp?size=1024`
          : null,
        refresh_token: req.accessData.refresh_token,
      };
      if (userDocument) {
        // update document
        if (userDocument.banner) data.banner = userDocument.banner;
        return updateUser(user.id, data);
      } else {
        // create new document
        data.discord_id = user.id;
        return createNewUser(data);
      }
    })
    .then(
      (returnedObject) => {
        // returnedObject => {discord_id} || UserDoument {...}
        req.session.userId = returnedObject.discord_id;
        req.session.isAdmin = returnedObject.admin ? true : false;
        req.session.isFounder = returnedObject.website_founder ? true : false;
        res.redirect("/");
      },
      () => {
        res
          .status(500)
          .render("error", { isUser: Boolean(req.session.userId) });
      }
    );
};

module.exports.logout = (req, res) => {
  // destroy session and redirect to home
  req.session.destroy(() => {
    if (req.query.redir) return res.redirect("/login");
    res.redirect("/");
  });
};

// check if user is logged in and pass render options to the next middleware
module.exports.setRenderOptions = async (req, res, next) => {
  const userId = req.session.userId;
  let data = { isUser: false, user: {} };
  if (userId) {
    const user = await getUser(userId);
    if (!user) {
      res.status(500).render("error", { isUser: true });
      return;
    }
    data = {
      isUser: true,
      user: {
        username: user.username,
        discriminator: user.discriminator,
        tag: `${user.username}#${user.discriminator}`,
        discord_id: user.discord_id,
        avatarURL: user.avatarURL,
        website_founder: user.website_founder,
      },
      profileOwner: false,
      isAdmin: req.session.isAdmin,
    };
  }
  req.renderOptions = data;
  next();
};
