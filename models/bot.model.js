const mongoose = require("mongoose");
const URI = process.env.DB_URI;

const Schema = mongoose.Schema({
  username: String,
  discriminator: String,
  avatarURL: String,
  discord_id: String,
  verified: {
    type: Boolean,
    defualt: false,
  },
  submitter: { discord_id: String, username: String, avatarURL: String },
  developers: [{ discord_id: String, username: String, avatarURL: String }], // max 2
  votes: {
    type: Number,
    default: 0,
  },
  tags: Array, // string[]
  about: String,
  markdown: String,
  prefix: { content: String, customizable: Boolean },
  inviteUrl: String,
  supportServer: String,
  github: String,
  timestamp: {
    type: Number,
    default: Date.now(),
  },
});

const Bot = mongoose.model("bot", Schema);

module.exports.getBot = (id) => {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(URI)
      .then(() => Bot.findOne({ discord_id: id }))
      .then(
        (bot) => {
          resolve(bot);
        },
        (err) => {
          reject(err);
        }
      );
  });
};

module.exports.getBotsById = (arrOfIds) => {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(URI)
      .then(() => Bot.find({}))
      .then(
        (result) => {
          resolve(result.filter((bot) => arrOfIds.includes(bot.discord_id)));
        },
        (err) => {
          reject(err);
        }
      );
  });
};

module.exports.removeBot = (id) => {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(URI)
      .then(() => Bot.deleteOne({ discord_id: id }))
      .then(
        () => {
          resolve(true);
        },
        (err) => {
          reject(err);
        }
      );
  });
};

module.exports.addBot = (data) => {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(URI)
      .then(() => {
        const bot = new Bot(data);
        return bot.save();
      })
      .then(
        () => {
          resolve(true);
        },
        (err) => {
          reject(err);
        }
      );
  });
};

module.exports.updateBot = (id, updates) => {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(URI)
      .then(() => Bot.findOneAndUpdate({ discord_id: id }, updates))
      .then(
        () => {
          resolve(true);
        },
        (err) => {
          reject(err);
        }
      );
  });
};

module.exports.updateUserBots = (userId, data) => {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(URI)
      .then(() =>
        Bot.find({
          $or: [
            { "submitter.discord_id": userId },
            { "developers.0.discord_id": userId },
            { "developers.1.discord_id": userId },
          ],
        })
      )
      .then(
        (bots) => {
          if (bots.length > 0) {
            bots.forEach(async (bot) => {
              if (bot.submitter.discord_id === userId) {
                bot.submitter = data;
              } else if (bot.developers[0].discord_id === userId) {
                bot.developers[0] = data;
              } else if (
                bot.developers[1] &&
                bot.developers[1].discord_id === userId
              ) {
                bot.developers[1] = data;
              }
              await bot.save();
            });
          }
          resolve(true);
        },
        (err) => {
          reject(err);
        }
      );
  });
};

module.exports.upvoteBot = (id) => {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(URI)
      .then(() =>
        Bot.findOneAndUpdate({ discord_id: id }, { $inc: { votes: 1 } })
      )
      .then(
        () => {
          resolve(true);
        },
        (err) => {
          reject(err);
        }
      );
  });
};

module.exports.findByTag = (tag, limit, page = 1) => {
  return new Promise((resolve, reject) => {
    botSearch({ tags: tag.toLowerCase() }, limit, page).then(
      (result) => resolve(result),
      (err) => reject(err)
    );
  });
};

module.exports.findByUserameOrAbout = (q, limit, page = 1) => {
  return new Promise((resolve, reject) => {
    botSearch(
      {
        $or: [{ username: new RegExp(q, "i") }, { about: new RegExp(q, "i") }],
      },
      limit,
      page
    ).then(
      (result) => resolve(result),
      (err) => reject(err)
    );
  });
};

module.exports.findByTagAndUserameOrAbout = (tag, q, limit, page = 1) => {
  return new Promise((resolve, reject) => {
    botSearch(
      {
        $and: [
          { tags: tag.toLowerCase() },
          {
            $or: [
              { username: new RegExp(q, "i") },
              { about: new RegExp(q, "i") },
            ],
          },
        ],
      },
      limit,
      page
    ).then(
      (result) => resolve(result),
      (err) => reject(err)
    );
  });
};

const botSearch = (query, limit, page) => {
  let result = {};
  return new Promise((resolve, reject) => {
    mongoose
      .connect(URI)
      .then(() =>
        Bot.find(query)
          .skip(page * limit - limit)
          .limit(limit)
      )
      .then(
        (bots) => {
          result.bots = bots;
        },
        (err) => {
          reject(err);
        }
      )
      .then(() => this.getDocumentsSize(query))
      .then(
        (size) => {
          result.totalSize = size;
          resolve(result);
        },
        (err) => reject(err)
      );
  });
};

module.exports.getTopBots = (limit) => {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(URI)
      .then(() => Bot.find().limit(limit).sort({ votes: -1 }))
      .then(
        (result) => {
          resolve(result);
        },
        (err) => {
          reject(err);
        }
      );
  });
};

module.exports.getTopVerifiedBots = (limit) => {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(URI)
      .then(() => Bot.find({ verified: true }).limit(limit).sort({ votes: -1 }))
      .then(
        (result) => {
          resolve(result);
        },
        (err) => {
          reject(err);
        }
      );
  });
};

module.exports.getLastAddedBots = (limit) => {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(URI)
      .then(() => Bot.find().limit(limit).sort({ timestamp: -1 }))
      .then(
        (result) => {
          resolve(result);
        },
        (err) => {
          reject(err);
        }
      );
  });
};

module.exports.getDocumentsSize = (filter = {}) => {
  return new Promise((resolve, reject) => {
    Bot.countDocuments(filter).then(
      (result) => {
        resolve(result);
      },
      (err) => {
        reject(err);
      }
    );
  });
};
