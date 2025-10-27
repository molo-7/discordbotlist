const showdown = require("showdown");
const markdownConventor = new showdown.Converter();
const fetch = require("node-fetch")
const Bots = require("../models/bot.model");
const { isBotInQueue, removeFromQueue, updateBot: updateBotInQueue } = require("../models/queue.model");
const { DISCORD_CHANNEL_ID, TAGS, ORIGIN, HOST_NAME } = require("../config.json");
const { BOT_TOKEN } = process.env;
const { addBot, removeBot: removeBotFromUserDoc, getUser } = require("../models/user.model");
const sendMessageAPI = `https://discordapp.com/api/v9/channels/${DISCORD_CHANNEL_ID}/messages`;
const usersBase = "https://discordapp.com/api/v9/users/";

module.exports.renderPage = (req, res, next) => {
  const id = req.params.botId;
  let data = req.renderOptions;
  Bots.getBot(id).then((bot) => {
    if (!bot) return next();
    data.inQueue = false;
    data.bot = bot;
    data.bot.markdown = markdownConventor.makeHtml(bot.markdown);
    data.actionSuccess = req.flash("actionSuccess")[0];
    data.actionFalid = req.flash("actionFalid")[0];
    data.isCreator = req.session.userId === bot.submitter.discord_id || bot.developers.some(dev => dev.discord_id === req.session.userId);
    res.render("bot", data)
  });
};

module.exports.renderPageForSubmittersAndStaff = (req, res) => {
  const id = req.params.botId;
  let data = req.renderOptions;
  isBotInQueue(id).then((bot) => {
    if (!bot) return res.status(404).render("404");
    let botCreator = req.session.userId === bot.submitter.discord_id || bot.developers.some(dev => dev.discord_id === req.session.userId); // Boolean
    // render if admin or bot creator/submitter
    if (req.session.isAdmin || botCreator) {
      data.inQueue = true;
      data.bot = bot;
      data.bot.markdown = markdownConventor.makeHtml(bot.markdown);
      data.isCreator = botCreator;
      data.actionSuccess = req.flash("actionSuccess")[0];
      data.actionFalid = req.flash("actionFalid")[0];
      res.render("bot", data)
      return;
    }
    res.status(404).render("404");
  });
};


module.exports.renderEditPage = async (req, res) => {
  const id = req.params.botId;
  let data = req.renderOptions;
  const bot = (await Bots.getBot(id)) || (await isBotInQueue(id))
  if (!bot.submitter.discord_id === req.session.userId && !bot.developers.some(dev => dev.discord_id === req.session.userId)) return res.status(404).render("404");
  data.bot = bot;
  data.isSubmitter = !bot.developers.some(dev => dev.discord_id === req.session.userId);
  data.tags = TAGS.sort();
  data.updated = req.flash("updated")[0];
  let submissionErrors = req.flash("submissionErrors");
  data.errMsg = submissionErrors[0];
  data.errTarget = submissionErrors[1];
  res.render("editbot", data)
}

let votesCooldown = [];
module.exports.renderVotePage = (req, res) => {
  const botId = req.params.botId;
  if (!botId) return res.status(400).render("404");
  let data = req.renderOptions;
  Bots.getBot(botId)
    .then(bot => {
      if (!bot) return res.status(400).render("404");
      data.bot = bot;
      data.cooldownTimestamp = null;
      data.upvoted = req.flash("upvoted")[0];
      let reqCooldown = votesCooldown.find(r => r.user === req.session.userId && r.bot === botId);
      if (reqCooldown) data.cooldownTimestamp = reqCooldown.timestamp;
      res.render("vote", data);
    })
}

module.exports.upvoteBot = (req, res) => {
  const botId = req.params.botId;
  if (!botId) return res.status(400).render("404");
  let reqCooldown = votesCooldown.find(r => r.user === req.session.userId && r.bot === botId);
  if (reqCooldown) return res.redirect("/bot/" + botId + "/vote");
  Bots.getBot(botId)
    .then(bot => {
      if (!bot) return res.status(400).render("404"); // returns undefined
      return Bots.upvoteBot(botId); // returns true or throw error
    })
    .then(upvoted => {
      if (!upvoted) return;
      let indexInCooldown = votesCooldown.push({ user: req.session.userId, timestamp: Date.now(), bot: botId }) - 1;
      setTimeout(() => votesCooldown.splice(indexInCooldown, 1), 43200000);
      req.flash("upvoted", true);
      res.redirect("/bot/" + botId + "/vote");
    })
    .catch(err => {
      console.error(err);
      res.status(500).render("error", { isUser: Boolean(req.session.userId) });
    })
}

module.exports.removeBot = async (req, res) => {
  const botId = req.params.botId;
  const botInQueue = await isBotInQueue(botId);
  if (botInQueue) {
    if (!botInQueue.submitter.discord_id === req.session.userId) return res.status(400).render("404");
    removeFromQueue(botId)
      .then(() => {
        res.redirect("/");
        fetch(sendMessageAPI, {
          method: "POST",
          body: JSON.stringify({
            content: `**<@${req.session.userId}> has removed his bot \`${botInQueue.username}#${botInQueue.discriminator}\` from the queue**`,
          }),
          headers: {
            Authorization: `Bot ${BOT_TOKEN}`,
            "Content-Type": "application/json",
          },
        })
          .then((response) => response.json())
          .then((msg) => (msg.code ? console.error(msg) : ""));
      }, (err) => {
        console.error(err);
        res.status(500).render("error", { isUser: Boolean(req.session.userId) });
      })
  } else {
    const bot = await Bots.getBot(botId);
    if (!bot) return res.status(400).render("404");
    if (!bot.submitter.discord_id === req.session.userId) return res.status(400).render("404");
    Bots.removeBot(botId)
      .then(async () => {
        await removeBotFromUserDoc(bot.submitter.discord_id, botId);
        if (bot.developers.length > 0) {
          bot.developers.forEach(async dev => removeBotFromUserDoc(dev.discord_id, botId))
        }
        return;
      }) // bookmark
      .then(() => {
        res.redirect("/");
        fetch(sendMessageAPI, {
          method: "POST",
          body: JSON.stringify({
            content: `**<@${req.session.userId}> has removed his bot \`${bot.username}#${bot.discriminator}\` from ${HOST_NAME} and it's no longer available in the website**`,
          }),
          headers: {
            Authorization: `Bot ${BOT_TOKEN}`,
            "Content-Type": "application/json",
          },
        })
          .then((response) => response.json())
          .then((msg) => (msg.code ? console.error(msg) : ""));
      }, (err) => {
        console.error(err);
        res.status(500).render("error", { isUser: Boolean(req.session.userId) });
      })
  }
}

let syncCooldown = [];
module.exports.syncBot = async (req, res) => {
  const botId = req.params.botId;
  if (!botId) return res.status(400).render("404");
  let reqCooldown = syncCooldown.find(r => r.user === req.session.userId);
  if (reqCooldown) {
    req.flash("actionFalid", "You Can Sync Your Bot Only One Time Per Hour ⏲️");
    res.redirect("/bot/" + botId);
    return;
  }
  const bot = await Bots.getBot(botId);
  if (!bot) return res.status(400).render("404");
  if (req.session.userId !== bot.submitter.discord_id && !bot.developers.find(dev => dev.discord_id === req.session.userId)) return res.status(400).render("404");
  fetch(usersBase + botId, {
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
    },
  })
    .then((r) => r.json())
    .then((user) =>
      Bots.updateBot(botId, {
        username: user.username,
        discriminator: user.discriminator,
        avatarURL: user.avatar
          ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp`
          : null
      }))
    .then((updated) => {
      let indexInCooldown = syncCooldown.push({ user: req.session.userId, timestamp: Date.now() }) - 1;
      setTimeout(() => syncCooldown.splice(indexInCooldown, 1), 3600000);
      req.flash("actionSuccess", "Synced Your Bot With Discord Successfully ✅")
      res.redirect("/bot/" + botId);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).render("error", { isUser: Boolean(req.session.userId) });
    })
};

module.exports.editBot = async (req, res) => {
  const botId = req.params.botId;
  const bot = await Bots.getBot(botId);
  // validation function
  function validate() {
    return new Promise(async (reslove, reject) => {
      const data = req.body;
      data.tags = data.tags.split(",");
      if (data.about) {
        if (data.about.length > 140) {
          req.flash(
            "submissionErrors",
            "Breif Description Maximum Length 140 Character !"
          );
          req.flash("submissionErrors", "brief-desc");

          reject();
        }
      } else {
        req.flash("submissionErrors", "Breif Description Is Required !");
        req.flash("submissionErrors", "brief-desc");

        reject();
      }
      if (data.markdown) {
        if (data.markdown.length > 2000) {
          req.flash(
            "submissionErrors",
            "Long Description Can't Be More Than 2000 Character !"
          );
          req.flash("submissionErrors", "long-desc");

          reject();
        } else if (data.markdown.length < 200) {
          req.flash("submissionErrors", "Minimum Length 200 Character !");
          req.flash("submissionErrors", "long-desc");

          reject();
        }
      } else {
        req.flash("submissionErrors", "Minimum Length 200 Character !");
        req.flash("submissionErrors", "long-desc");

        reject();
      }
      if (data.prefix) {
        if (data.prefix.length > 5) {
          req.flash("submissionErrors", "Prefix Can't Be More Than 5 Characters !");
          req.flash("submissionErrors", "prefix");

          reject();
        }
      } else {
        req.flash("submissionErrors", "Prefix Is Required !");
        req.flash("submissionErrors", "prefix");

        reject();
      }
      if (data.tags.length !== 0) {
        if (data.prefix.length > 6) {
          req.flash("submissionErrors", "You Can't Pick More Than 6 Tags !");
          req.flash("submissionErrors", "dropdown");

          reject();
        }
      } else {
        req.flash("submissionErrors", "Pick Some Tags !");
        req.flash("submissionErrors", "dropdown");

        reject();
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

          reject();
        }
      } else {
        req.flash("submissionErrors", "Bot Invention URL Is Required!");
        req.flash("submissionErrors", "invite-url");

        reject();
      }
      if (
        data.supportServer &&
        (!data.supportServer.startsWith("https://discord.gg/") &&
          !data.supportServer.startsWith("https://discord.com/invite/"))
      ) {
        req.flash(
          "submissionErrors",
          "Support Server Invitation Link Must Starts With https://discord.gg/ or https://discord.com/invite/"
        );
        req.flash("submissionErrors", "support-server");

        reject();
      }
      if (data.githubRepo) {
        if (!data.githubRepo.startsWith("https://github.com")) {
          req.flash(
            "submissionErrors",
            "Invalid github repository url"
          );
          req.flash("submissionErrors", "github-repo");
          reject();
        } else {
          const response = await fetch(data.githubRepo);
          if (!response.ok && response.status === 404) {
            req.flash(
              "submissionErrors",
              "No public repository exists with the following url " + data.githubRepo
            );
            req.flash("submissionErrors", "github-repo");
            reject();
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
          return reject();
        }
        if (data.dev1.trim().length !== 18 || isNaN(data.dev1)) {
          req.flash(
            "submissionErrors",
            "Invalid id format"
          );
          req.flash("submissionErrors", "dev1");
          return reject();
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
          return reject();
        }
      }
      if (data.dev2) {
        if (data.dev2 === req.session.userId) {
          req.flash(
            "submissionErrors",
            `You can't add yourslef as a bot developer, you are bot submitter already!`
          );
          req.flash("submissionErrors", "dev2");
          return reject();
        }
        if (data.dev2.trim().length !== 18 || isNaN(data.dev2)) {
          req.flash(
            "submissionErrors",
            "Invalid id format"
          );
          req.flash("submissionErrors", "dev2");
          return reject();
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
          return reject();
        }
      }
      data.developers = developers;
      reslove(data)
    })
  }
  // update in queue model
  if (!bot) {
    const bot = await isBotInQueue(botId);
    if (!bot) return;
    if (!bot.submitter.discord_id === req.session.userId && !bot.developers.some(dev => dev.discord_id === req.session.userId)) return;
    validate().then((data) => {
      return updateBotInQueue(botId, {
        about: data.about,
        markdown: data.markdown,
        prefix: { content: data.prefix, customizable: data.customizablePrefix },
        tags: data.tags,
        inviteUrl: data.inviteUrl,
        supportServer: data.supportServer ? data.supportServer : null,
        github: data.githubRepo || null,
        developers: data.developers,
      })
    })
      .then(() => {
        req.flash("updated", true);
        res.redirect(`/bot/${botId}/edit`);
      })
      .catch(err => {
        res.redirect(`/bot/${botId}/edit`);
      });
  } else {
    // update in bots model
    if (!bot.submitter.discord_id === req.session.userId && !bot.developers.some(dev => dev.discord_id === req.session.userId)) return;
    validate().then(async (data) => {
      // modfiy bots in developers documents if the submitter changed them !
      if (data.developers[0]?.discord_id !== bot.developers[0]?.discord_id) {
        if (bot.developers[0]) await removeBotFromUserDoc(bot.developers[0].discord_id, botId);
        if (data.developers[0]) await addBot(data.developers[0].discord_id, botId);
      }
      if (data.developers[1]?.discord_id !== bot.developers[1]?.discord_id) {
        if (bot.developers[1]) await removeBotFromUserDoc(bot.developers[1].discord_id);
        if (data.developers[1]) await addBot(data.developers[1].discord_id, botId);
      }

      return Bots.updateBot(botId, {
        about: data.about,
        markdown: data.markdown,
        prefix: { content: data.prefix, customizable: data.customizablePrefix },
        tags: data.tags,
        inviteUrl: data.inviteUrl,
        supportServer: data.supportServer ? data.supportServer : null,
        github: data.githubRepo || null,
        developers: data.developers,
      })
    }).then(() => {
      req.flash("updated", true);
      res.redirect(`/bot/${botId}/edit`);
    })
      .catch(err => {
        res.redirect(`/bot/${botId}/edit`);
      });
  }
}

module.exports.rejectBot = async (req, res) => {
  const botId = req.params.botId;
  const { reason } = req.body;
  const botInQueue = await isBotInQueue(botId);
  if (!botInQueue) return res.status(400).render("404");
  if (!reason) {
    req.flash("actionFalid", "🤠 Rejection Reason Is Required");
    res.redirect("/bot/" + botId);
    return;
  }
  removeFromQueue(botId)
    .then(() => {
      res.redirect("/");
      fetch(sendMessageAPI, {
        method: "POST",
        body: JSON.stringify({
          content: `**❌ Bot Rejected \n<@${botInQueue.submitter.discord_id}>**`,
          embeds: [{
            title: "Bot Rejection",
            type: "rich",
            color: 16069446,
            description: `\`${botInQueue.username}#${botInQueue.discriminator}\` bot submission has been rejected, which was submitted by [${botInQueue.submitter.username}](${ORIGIN}/user/${botInQueue.submitter.discord_id}) <@${botInQueue.submitter.discord_id}>\nReason: ${reason}\nif you have any questions ask at #support`,
            fields: [
              {
                name: "<:mod:895395972945956935> Moderator",
                value: `<@${req.session.userId}>`,
                inline: true
              },
              {
                name: "<:bot:880830840022654996> Bot_id",
                value: botId,
                inline: true
              }
            ],
            thumbnail: { url: botInQueue.avatarURL || "https://cdn.discordapp.com/attachments/895396977104285707/895397154401693706/favicon.png" },
            author: {
              name: HOST_NAME,
              url: ORIGIN,
              icon_url: "https://cdn.discordapp.com/attachments/895396977104285707/895397154401693706/favicon.png",
            }
          }],
        }),
        headers: {
          Authorization: `Bot ${BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((msg) => (msg.code ? console.error(msg) : ""));
    }, (err) => {
      console.error(err);
      res.status(500).render("error", { isUser: Boolean(req.session.userId) });
    })
}

module.exports.approveBot = async (req, res) => {
  const botId = req.params.botId;
  const botInQueue = await isBotInQueue(botId);
  if (!botInQueue) return res.status(400).render("404");
  removeFromQueue(botId)
    .then(() => Bots.addBot({
      username: botInQueue.username,
      discriminator: botInQueue.discriminator,
      avatarURL: botInQueue.avatarURL,
      discord_id: botId,
      submitter: botInQueue.submitter,
      developers: botInQueue.developers,
      tags: botInQueue.tags,
      about: botInQueue.about,
      markdown: botInQueue.markdown,
      prefix: botInQueue.prefix,
      inviteUrl: botInQueue.inviteUrl,
      supportServer: botInQueue.supportServer,
      github: botInQueue.github,
    }))
    .then(async () => {
      // push to submitter's bots
      await addBot(botInQueue.submitter.discord_id, botId)
      // push to developers' bots
      if (botInQueue.developers.length > 0) {
        botInQueue.developers.forEach(async dev => {
          await addBot(dev.discord_id, botId)
        })
      }
      res.redirect(`/bot/${botId}`)
      fetch(sendMessageAPI, {
        method: "POST",
        body: JSON.stringify({
          content: `**✅ Bot Approved\n<@${botInQueue.submitter.discord_id}>**`,
          embeds: [{
            title: "Bot Approvement",
            type: "rich",
            color: 7909211,
            description: `\`${botInQueue.username}#${botInQueue.discriminator}\` bot submission has been approved, which was submitted by [${botInQueue.submitter.username}](${ORIGIN}/user/${botInQueue.submitter.discord_id}) <@${botInQueue.submitter.discord_id}>`,
            fields: [
              {
                name: "<:mod:895395972945956935> Moderator",
                value: `<@${req.session.userId}>`,
                inline: true
              },
              {
                name: "<:bot:880830840022654996> Bot_id",
                value: botId,
                inline: true
              }
            ],
            thumbnail: { url: botInQueue.avatarURL || "https://cdn.discordapp.com/attachments/895396977104285707/895397154401693706/favicon.png" },
            author: {
              name: HOST_NAME,
              url: ORIGIN,
              icon_url: "https://cdn.discordapp.com/attachments/895396977104285707/895397154401693706/favicon.png",
            }
          }],
          components: [{
            type: 1,
            components: [
              {
                type: 2,
                style: 5,
                label: botInQueue.username,
                url: `${ORIGIN}/bot/${botId}`,
              },
            ],
          }],
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
        console.error(err);
        res.status(500).render("error", { isUser: Boolean(req.session.userId) });
      })
}

module.exports.kickBot = async (req, res) => {
  const botId = req.params.botId;
  if (!req.session.isFounder) return res.status(400).render("404");
  const bot = await Bots.getBot(botId);
  if (!bot) return res.status(400).render("404");
  Bots.removeBot(botId)
    .then(async () => {
      await removeBotFromUserDoc(bot.submitter.discord_id, botId);
      if (bot.developers.length > 0) {
        bot.developers.forEach(async dev => removeBotFromUserDoc(dev.discord_id, botId))
      }
      return;
    }) // bookmark
    .then(() => {
      res.redirect(`/bot/${botId}`);
      fetch(sendMessageAPI, {
        method: "POST",
        body: JSON.stringify({
          content: `**🛑 <@${req.session.userId}> Kicked \`${bot.username}\` From atombotlist\n||<@${bot.submitter.discord_id}> if you have any questions <#893413959317729290>||**`,
        }),
        headers: {
          Authorization: `Bot ${BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((msg) => (msg.code ? console.error(msg) : ""));
    })
    .catch(err => {
      console.error(err);
      res.status(500).render("error", { isUser: Boolean(req.session.userId) });
    })
}