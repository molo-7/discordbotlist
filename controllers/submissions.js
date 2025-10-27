const fetch = require("node-fetch");
const usersBase = "https://discordapp.com/api/v9/users/";
const { TAGS, DISCORD_CHANNEL_ID, ORIGIN, HOST_NAME, ROLE_ID } = require("../config.json");
const { BOT_TOKEN } = process.env;
const {
  addToQueue,
  getQueueLength,
  isBotInQueue,
  getUserBots,
} = require("../models/queue.model");
const { getUser } = require("../models/user.model");
const { getBot } = require("../models/bot.model");
const sendMessageAPI = `https://discordapp.com/api/v9/channels/${DISCORD_CHANNEL_ID}/messages`;

module.exports.renderPage = async (req, res) => {
  let data = req.renderOptions;
  const length = await getQueueLength();
  if (length > 20) {
    data.showForm = false;
    data.notice = true;
    data.noticeTitle = "Full Queue";
    data.noticeMsg = `Queue has reached its limit, check <a href="/queue">queue</a> and try again later`;
    res.render("addbot", data);
    return;
  }
  let showForm = Boolean(req.flash("showForm")[0]);
  let submissionErrors = req.flash("submissionErrors");
  let noticeScreen = req.flash("noticeScreen");
  data.showForm = showForm;
  data.errMsg = submissionErrors[0];
  data.errTarget = submissionErrors[1];
  data.searchError = req.flash("searchErrors")[0];
  data.bot = req.flash("bot")[0];
  data.tags = showForm ? TAGS.sort() : [];
  data.notice = noticeScreen[0];
  data.noticeTitle = noticeScreen[1];
  data.noticeMsg = noticeScreen[2];
  res.render("addbot", data);
};

module.exports.findBot = async (req, res, next) => {
  const { botId, submit } = req.body;
  if (!botId && submit) next();
  if (!botId) return;
  if (botId.trim().length !== 18) {
    req.flash("searchErrors", "Invalid Discord ID !!");
    res.redirct("/addbot");
  }
  const length = await getQueueLength();
  if (length > 20) {
    req.flash("noticeScreen", true);
    req.flash("noticeScreen", "Full Queue");
    req.flash(
      "noticeScreen",
      `Queue has reached its limit, check <a href="/queue">queue</a> and try again later`
    );
    res.redirect("/addbot");
    return;
  }
  const userBots = await getUserBots(req.session.userId);
  if (userBots.length > 3) {
    req.flash("noticeScreen", true);
    req.flash("noticeScreen", "Limit Reached");
    req.flash(
      "noticeScreen",
      `You have reached your limit of bots in the queue, every user can only have 3 bots at maximum in queue at the same time ! join <a href="/discord">our discord server</a> and wait until one of your bots get verified`
    );
    res.redirect("/addbot");
    return;
  }
  const BotInQueue = await isBotInQueue(botId);
  if (BotInQueue) {
    req.flash("noticeScreen", true);
    req.flash("noticeScreen", "Already Submitted");
    req.flash(
      "noticeScreen",
      `The bot you are trying to search, is already already been submitted to ${HOST_NAME}. It can't be submitted twice !`
    );
    res.redirect("/addbot");
    return;
  }
  const botDocument = await getBot(botId);
  if (botDocument) {
    req.flash("noticeScreen", true);
    req.flash("noticeScreen", "Already Submitted");
    req.flash(
      "noticeScreen",
      `The bot you are trying to search, is already already been submitted to ${HOST_NAME}. It can't be submitted twice !`
    );
    res.redirect("/addbot");
    return;
  }
  fetch(usersBase + botId, {
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
    },
  })
    .then((r) => r.json())
    .then((user) => {
      if (!user.id) {
        req.flash("searchErrors", `unknown discord user!`);
        res.redirect("/addbot");
      }
      if (!user.bot) {
        req.flash(
          "searchErrors",
          `${user.username}#${user.discriminator} Is not A Bot!`
        );
        res.redirect("/addbot");
        return;
      }
      req.flash("showForm", true);
      req.flash("bot", user);
      res.redirect("/addbot");
    });
};

module.exports.submit = async (req, res) => {
  const userBots = await getUserBots(req.session.userId);
  if (userBots.length > 3) {
    req.flash("noticeScreen", true);
    req.flash("noticeScreen", "Limit Reached");
    req.flash(
      "noticeScreen",
      `You have reached your limit of bots in the queue, every user can only have 3 bots at maximum in queue at the same time ! join <a href="/discord">our discord server</a> and wait until one of your bots get verified`
    );
    res.redirect("/addbot");
    return;
  }
  const BotInQueue = await isBotInQueue(req.body.id);
  if (BotInQueue) {
    req.flash("noticeScreen", true);
    req.flash("noticeScreen", "Already Submitted");
    req.flash(
      "noticeScreen",
      `The bot you are trying to search, is already already been submitted to ${HOST_NAME}. It can't be submitted twice !`
    );
    res.redirect("/addbot");
    return;
  }
  const botDocument = await getBot(req.body.id);
  if (botDocument) {
    req.flash("noticeScreen", true);
    req.flash("noticeScreen", "Already Submitted");
    req.flash(
      "noticeScreen",
      `The bot you are trying to search, is already already been submitted to ${HOST_NAME}. It can't be submitted twice !`
    );
    res.redirect("/addbot");
    return;
  }
  const data = req.body;
  data.tags = data.tags.split(",");
  let bot = {
    id: data.id,
    username: data.tag.slice(0, data.tag.lastIndexOf("#")),
    discriminator: data.tag.slice(data.tag.lastIndexOf("#") + 1),
    avatar: data.avatar.slice(
      data.avatar.lastIndexOf(`/${data.id}/`) + `/${data.id}/`.length,
      data.avatar.lastIndexOf(".webp")
    ),
  };
  const redirToForm = () => {
    req.flash("showForm", true);
    req.flash("bot", bot);
    res.redirect("/addbot");
  };
  if (data.about) {
    if (data.about.length > 140) {
      req.flash(
        "submissionErrors",
        "Breif Description Maximum Length 140 Character !"
      );
      req.flash("submissionErrors", "brief-desc");
      return redirToForm();
    }
  } else {
    req.flash("submissionErrors", "Breif Description Is Required !");
    req.flash("submissionErrors", "brief-desc");
    return redirToForm();
  }
  if (data.markdown) {
    if (data.markdown.length > 2000) {
      req.flash(
        "submissionErrors",
        "Long Description Can't Be More Than 2000 Character !"
      );
      req.flash("submissionErrors", "long-desc");
      return redirToForm();
    } else if (data.markdown.length < 200) {
      req.flash("submissionErrors", "Minimum Length 200 Character !");
      req.flash("submissionErrors", "long-desc");
      return redirToForm();
    }
  } else {
    req.flash("submissionErrors", "Minimum Length 200 Character !");
    req.flash("submissionErrors", "long-desc");
    return redirToForm();
  }
  if (data.prefix) {
    if (data.prefix.length > 5) {
      req.flash("submissionErrors", "Prefix Can't Be More Than 5 Characters !");
      req.flash("submissionErrors", "prefix");
      return redirToForm();
    }
  } else {
    req.flash("submissionErrors", "Prefix Is Required !");
    req.flash("submissionErrors", "prefix");
    return redirToForm();
  }
  if (data.tags.length !== 0) {
    if (data.prefix.length > 6) {
      req.flash("submissionErrors", "You Can't Pick More Than 6 Tags !");
      req.flash("submissionErrors", "dropdown");
      return redirToForm();
    }
  } else {
    req.flash("submissionErrors", "Pick Some Tags !");
    req.flash("submissionErrors", "dropdown");
    return redirToForm();
  }
  if (data.inviteUrl) {
    if (
      !data.inviteUrl.startsWith("https://discord.com/oauth2/authorize") &&
      !data.inviteUrl.startsWith("https://discord.com/api/oauth2/authorize")
    ) {
      req.flash(
        "submissionErrors",
        "Invalid Bot Invition Link, Redirects are not available"
      );
      req.flash("submissionErrors", "invite-url");
      return redirToForm();
    }
  } else {
    req.flash("submissionErrors", "Bot Invention URL Is Required!");
    req.flash("submissionErrors", "invite-url");
    return redirToForm();
  }
  if (
    data.supportServer &&
    !data.supportServer.startsWith("https://discord.gg/") &&
    !data.supportServer.startsWith("https://discord.com/invite/")
  ) {
    req.flash(
      "submissionErrors",
      "Support Server Invitation Link Must Starts With https://discord.gg/ or https://discord.com/invite/"
    );
    req.flash("submissionErrors", "support-server");
    return redirToForm();
  }
  if (data.githubRepo) {
    if (!data.githubRepo.startsWith("https://github.com")) {
      req.flash("submissionErrors", "Invalid github repository url");
      req.flash("submissionErrors", "github-repo");
      return redirToForm();
    } else {
      const response = await fetch(data.githubRepo);
      if (!response.ok && response.status === 404) {
        req.flash(
          "submissionErrors",
          "No public repository exists with the following url " +
            data.githubRepo
        );
        req.flash("submissionErrors", "github-repo");
        return redirToForm();
      }
    }
  }
  let developers = [];
  if (data.dev1) {
    if (data.dev1 === req.session.userId) {
      req.flash(
        "submissionErrors",
        `You can't add yourslef as a bot developer, you are bot submitter already!`
      );
      req.flash("submissionErrors", "dev1");
      return redirToForm();
    }
    if (data.dev1.length !== 18 || isNaN(data.dev1)) {
      req.flash("submissionErrors", "Invalid id format");
      req.flash("submissionErrors", "dev1");
      return redirToForm();
    }
    const user = await getUser(data.dev1);
    if (user) {
      developers[0] = {
        discord_id: user.discord_id,
        username: user.username,
        avatarURL: user.avatarURL,
      };
    } else {
      req.flash(
        "submissionErrors",
        `No users with the id ${data.dev1} in our list`
      );
      req.flash("submissionErrors", "dev1");
      return redirToForm();
    }
  }
  if (data.dev2) {
    if (data.dev2 === req.session.userId) {
      req.flash(
        "submissionErrors",
        `You can't add yourslef as a bot developer, you are bot submitter already!`
      );
      req.flash("submissionErrors", "dev2");
      return redirToForm();
    }
    if (data.dev2.length !== 18 || isNaN(data.dev2)) {
      req.flash("submissionErrors", "Invalid id format");
      req.flash("submissionErrors", "dev2");
      return redirToForm();
    }
    const user = await getUser(data.dev2);
    if (user) {
      developers[0] = {
        discord_id: user.discord_id,
        username: user.username,
        avatarURL: user.avatarURL,
      };
    } else {
      req.flash(
        "submissionErrors",
        `No users with the id ${data.dev2} in our list`
      );
      req.flash("submissionErrors", "dev2");
      return redirToForm();
    }
  }
  const length = await getQueueLength();
  if (length > 20) {
    req.flash("noticeScreen", true);
    req.flash("noticeScreen", "Full Queue");
    req.flash(
      "noticeScreen",
      `Queue has reached its limit, check <a href="/queue">queue</a> and try again later`
    );
    res.redirect("/addbot");
    return;
  }
  addToQueue({
    username: bot.username,
    discriminator: bot.discriminator,
    discord_id: data.id,
    avatarURL: data.avatar,
    submitter: {
      discord_id: req.session.userId,
      username: data.submitter || "Unkown-User",
      avatarURL: data.submitterAvatar || null,
    },
    about: data.about,
    markdown: data.markdown,
    prefix: { content: data.prefix, customizable: data.customizablePrefix },
    tags: data.tags,
    inviteUrl: data.inviteUrl,
    supportServer: data.supportServer ? data.supportServer : null,
    github: data.githubRepo || null,
    timestamp: Date.now(),
    developers: developers,
  }).then(
    () => {
      res.redirect(`/queue?scrollTo=${data.id}`);
      fetch(sendMessageAPI, {
        method: "POST",
        body: JSON.stringify({
          content: `**${data.submitter} <@${req.session.userId}>** submitted \`${data.tag}\`\n<@&${ROLE_ID}>`,
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  style: 5,
                  label: "Queue",
                  url: `${ORIGIN}/queue?scrollTo=${data.id}`,
                },
                {
                  type: 2,
                  style: 5,
                  label: "Bot Profile",
                  url: `${ORIGIN}/bot/${data.id}`,
                },
              ],
            },
          ],
        }),
        headers: {
          Authorization: `Bot ${BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((msg) => (msg.code ? console.error(msg) : ""));
    },
    (err) => {
      res.status(500).render("error", { isUser: Boolean(req.session.userId) });
      console.error(err);
    }
  );
};
