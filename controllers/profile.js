const notFoundController = require("./not_found");
const { getUser, updateUser } = require("../models/user.model");
const { getBotsById } = require("../models/bot.model");
const usersBase = "https://discordapp.com/api/v9/users/";
const { BOT_TOKEN } = process.env;
const fetch = require("node-fetch");

module.exports.getProfile = async (req, res) => {
  const profileOwnerId = req.params.userId;
  if (!profileOwnerId) return notFoundController(req, res);
  const profileOwner = await getUser(profileOwnerId);
  if (!profileOwner) return notFoundController(req, res);
  const renderData = req.renderOptions ? req.renderOptions : { isUser: false };
  renderData.owner = profileOwner;
  renderData.owner.tag = `${renderData.owner.username}#${renderData.owner.discriminator}`;
  renderData.profilePage = true;
  const userIsTheOwner = req.session.userId === profileOwner.discord_id; // Boolean
  renderData.editTab = req.query.tab === "edit" && userIsTheOwner;
  renderData.profileOwner = userIsTheOwner;
  renderData.updated = req.flash("updated")[0];
  renderData.scrollTo = req.flash("scrollTo")[0];
  renderData.editProfileError = req.flash("editProfileError")[0];
  if (!renderData.editTab && profileOwner.bots.length > 0) {
    renderData.owner.bots = await getBotsById(profileOwner.bots)
  };
  res.render("profile", renderData);
};

module.exports.syncProfile = async (req, res) => {
  const profileOwnerId = req.params.userId;
  if (req.session.userId !== profileOwnerId) return;
  const userDocument = await getUser(profileOwnerId);
  fetch(usersBase + profileOwnerId, {
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
    },
  })
    .then((r) => r.json())
    .then((user) =>
      updateUser(user.id, {
        username: user.username,
        discriminator: user.discriminator,
        avatarURL: user.avatar
          ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp`
          : null,
        banner: user.banner
          ? `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.webp?size=1024`
          : userDocument.banner
            ? userDocument.banner
            : null,
        discord_id: user.id,
      }))
    .then((user) => {
      req.flash("updated", "Synced your account with discord successfully");
      res.redirect(`/user/${user.discord_id}?tab=edit`);
    })
    .catch(() => res.render("error", { isUser: Boolean(req.session.userId) }));
};

module.exports.editProfile = (req, res) => {
  const profileOwnerId = req.params.userId;
  if (req.session.userId !== profileOwnerId) return;
  const { banner, bio } = req.body;
  if (bio && bio.length > 140) {
    req.flash("editProfileError", "Bio length can't be more than 140");
    req.flash("scrollTo", "#bio_form");
    res.redirect("/user/" + profileOwnerId + "?tab=edit");
    return;
  }
  if (banner) {
    const imagesHost = "https://i.imgur.com/";
    if (!banner.startsWith(imagesHost)) {
      req.flash(
        "editProfileError",
        `Banner\'s image url can only be provided from <a href="https://imgur.com/upload">imgur</a><br>Example <code>https://i.imgur.com/N6uQ1zQ.jpg</code>`
      );
      req.flash("scrollTo", "#banner_form");
      res.redirect("/user/" + profileOwnerId + "?tab=edit");
      return;
    } else if (
      !["png", "jpg"].includes(banner.slice(banner.length - 3))
    ) {
      req.flash(
        "editProfileError",
        "Supported formats: <code>png and jpg</code>"
      );
      req.flash("scrollTo", "#banner_form");
      res.redirect("/user/" + profileOwnerId + "?tab=edit");
      return;
    }
    fetch(banner).then((r) => {
      if (r.status !== 200) {
        req.flash(
          "editProfileError",
          `<code>${banner}</code> Not a vaild image direct link !`
        );
        req.flash("scrollTo", "#banner_form");
        res.redirect("/user/" + profileOwnerId + "?tab=edit");
        return;
      }
    });
  }
  let data = { bio: "", banner: "" };
  if (bio) data.bio = bio;
  if (banner) data.banner = banner;
  updateUser(profileOwnerId, data).then(
    () => {
      req.flash("updated", "Updated your profile successfully");
      res.redirect("/user/" + profileOwnerId + "?tab=edit");
    },
    () => res.render("error", { isUser: Boolean(req.session.userId) })
  );
};
