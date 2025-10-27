// modules
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const SessionStore = require("connect-mongodb-session")(session);
const flash = require("connect-flash");
const { DB_URI } = process.env;
const PORT = process.env.PORT || 3000;

// sessions store
const STORE = new SessionStore({
  uri: DB_URI,
  collection: "sessions",
});

app.use(
  session({
    secret: "OcxbEw3$pno*DLVka+E",
    saveUninitialized: false,
    store: STORE,
    resave: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  })
);

// mongoose settings
mongoose.set("useNewUrlParser", true);
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);
mongoose.set("useUnifiedTopology", true);

// import routes
const loginRouter = require("./routes/login");
const logoutRouter = require("./routes/logout");
const botsRouter = require("./routes/bot");
const profilesRouter = require("./routes/user");
const addbotRouter = require("./routes/addbot");
const queueRouter = require("./routes/queue");
const discordRouter = require("./routes/discord");
const exploreRouter = require("./routes/explore");
const notFoundController = require("./controllers/not_found");
const nojsRoute = require("./routes/noscirpt");
const homeRouter = require("./routes/home");

// views config
app.set("view engine", "ejs");
app.set("views", "views");

// assets
app.use(express.static(path.join(__dirname, "assets")));
app.use(flash());

// routes
app.use("/login", loginRouter);
app.use("/logout", logoutRouter);
app.use("/bot", botsRouter);
app.use("/user", profilesRouter);
app.use("/addbot", addbotRouter);
app.use("/explore", exploreRouter);
app.use("/queue", queueRouter);
app.use("/discord", discordRouter);
app.use("/noscript", nojsRoute);
app.get("/", homeRouter);
app.use("/", notFoundController);

app.listen(PORT, () => console.log(`Server Listing on Port: ${PORT}`));