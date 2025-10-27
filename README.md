# atombotlist

Discord bot list app with EJS CSS ExpressJS MongoDB

> I built this project back in 2022 and just found it while checking some of my old files.

## Create .env file

store your MongoDB database credentials

```
DB_URI = mongodb+srv://<username>:<password>@cluster0.6m5cz.mongodb.net/botlist
```

store your discord bot client information

```
CLIENT_ID =
CLIENT_SECRET =
DISCORD_INVITE =
BOT_TOKEN =
OAuth2_URL =
```

`CLIENT_ID`: your discord app client id

`CLIENT_SECRET`: your discord app client secret

![preview](https://i.postimg.cc/K8tVxHF8/Screenshot-2022-02-20-162158.png)

`BOT_TOKEN`: the access token for your discord bot, required for sending messages and fetching users

`OAuth2_URL`: the discord authentication url, it should redircts to /login/cb route.

example `https://discord.com/api/oauth2/authorize?client_id=872945552868905090&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Flogin%2Fcb&response_type=code&scope=identify`

## Config.json

config.json contains the configurations that can be edited

`TAGS`: bots tags

`DISCORD_CHANNEL_ID`: the channel id to send website logs in

`ROLE_ID`: role id that the bot will mention in logs messages

`DISCORD_INVITE`: invite url for your discord server, /discord route redirects to `DISCORD_INVITE` url

`ORIGIN`: hosting url [origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Origin), should be the same origin with discord authentication redirect url

`HOST_NAME`: url host name, ex : atombotlist.xyz

## Installation

To run this project, install it locally using npm:

```
$ npm install
$ npm start
```
