const mongoose = require("mongoose");
const URI = process.env.DB_URI;

/* Bots In Queue */
const Schema = mongoose.Schema({
  username: String,
  discriminator: String,
  discord_id: String,
  avatarURL: String,
  submitter: { discord_id: String, username: String, avatarURL: String },
  about: String,
  markdown: String,
  prefix: { content: String, customizable: Boolean },
  tags: Array,
  inviteUrl: String,
  supportServer: String,
  github: String,
  developers: [{ discord_id: String, username: String, avatarURL: String }],
  timestamp: {
    type: Number,
    default: Date.now(),
  },
});

const Queue = mongoose.model("queue", Schema);

module.exports.getQueue = () => {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(URI)
      .then(() => Queue.find().sort({ timestamp: 1 }))
      .then((queue) => {
        queue = queue.map(
          (bot) =>
          (bot = {
            username: bot.username,
            discord_id: bot.discord_id,
            avatarURL: bot.avatarURL,
            submitter: bot.submitter,
            developers: bot.developers,
            about: bot.about,
          })
        );
        resolve(queue);
      });
  });
};

module.exports.getQueueLength = () => {
  return new Promise((resolve, reject) => {
    Queue.countDocuments((err, length) => {
      if (err) return reject(err);
      resolve(length)
    })
  });
};

module.exports.isBotInQueue = (id) => {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(URI)
      .then(() => Queue.findOne({ discord_id: id }))
      .then((document) => {
        document ? resolve(document) : resolve(false); // {...} | flase
      });
  });
};

module.exports.addToQueue = (bot) => {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(URI)
      .then(() => {
        const botInQueue = new Queue(bot);
        return botInQueue.save();
      })
      .then(
        (botDocument) => {
          resolve(true);
        },
        (err) => {
          reject(err);
        }
      );
  });
};

module.exports.removeFromQueue = (id) => {
  return new Promise((resolve, reject) => {
    mongoose.connect(URI)
      .then(() => Queue.deleteOne({ discord_id: id }))
      .then(() => {
        resolve(true);
      }, (err) => {
        reject(err)
      })
  })
}

module.exports.getUserBots = (id) => {
  return new Promise((resolve) => {
    mongoose.connect(URI)
      .then(() => Queue.find({ discord_id: id }))
      .then((result) => {
        resolve(result);
      })
  })
}

module.exports.updateBot = (id, updates) => {
  return new Promise((resolve, reject) => {
    mongoose.connect(URI)
      .then(() => Queue.findOneAndUpdate({ discord_id: id }, updates))
      .then(() => {
        resolve(true);
      }, (err) => {
        reject(err)
      })
  })
}