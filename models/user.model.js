const mongoose = require("mongoose");
const URI = process.env.DB_URI;
const Bot = require("./bot.model");

const userSchema = mongoose.Schema({
  username: String,
  discriminator: String,
  discord_id: String,
  avatarURL: String,
  badeges: Array,
  banner: String,
  bio: String,
  admin: {
    type: Boolean,
    default: false,
  },
  website_founder: { // an admin with the absoulte permissions
    type: Boolean,
    default: false,
  },
  bots: Array, // discord_id[]
  refresh_token: String,
});

const Users = mongoose.model("user", userSchema);

module.exports.isUser = (id) => {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(URI)
      .then(() => Users.findOne({ discord_id: id }))
      .then((user) => {
        user ? resolve(true) : resolve(false);
      });
  });
};

module.exports.updateUser = (id, data) => {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(URI)
      .then(() => Users.findOneAndUpdate({ discord_id: id }, data))
      .then(
        async (userBeforeUpdates) => {
          if (userBeforeUpdates.bots.length > 0) await Bot.updateUserBots(id, { username: data.username, avatarURL: data.avatarURL, discord_id: data.discord_id, });
          resolve(userBeforeUpdates);
        },
        (err) => {
          reject(err);
        }
      )
  });
};

module.exports.createNewUser = (data) => {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(URI)
      .then(() => {
        const user = new Users(data);
        return user.save();
      })
      .then(
        () => {
          resolve({ discord_id: data.discord_id });
        },
        (err) => {
          reject(err);
        }
      );
  });
};

module.exports.getUser = (discord_id) => {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(URI)
      .then(() => Users.findOne({ discord_id: discord_id }))
      .then((user) => {
        user ? resolve(user) : resolve(null);
      });
  });
};

module.exports.addBot = (userId, bot) => {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(URI)
      .then(() => Users.updateOne({ discord_id: userId }, { $push: { bots: bot } }))
      .then(() => {
        resolve(true);
      },
        (err) => {
          reject(err);
        });
  });
}

module.exports.removeBot = (userId, botId) => {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(URI)
      .then(() => Users.updateOne({ discord_id: userId }, { $pull: { "bots": botId } }))
      .then(() => {
        resolve(true);
      },
        (err) => {
          reject(err);
        });
  });
}