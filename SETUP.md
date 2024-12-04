# Setup

Adapted from:
https://discord.com/developers/docs/tutorials/hosting-on-cloudflare-workers


## Create Discord bot

Go to [Discord Developer Dashboard](https://discord.com/developers/applications)
and create an application.

Save the Application Id and Public Key. These will be `DISCORD_APPLICATION_ID`
and `DISCORD_PUBLIC_KEY` respectively.

Go to the Bot tab and create a bot.

Save the token for the bot. This will be `DISCORD_TOKEN`.


## Setup bot permissions

On the developer portal, go to OAuth2 -> URL Generator.

Check the following under Scopes:

- `bot`
- `applications.commands`

Check the following under Bot Permissions:

- `Send Messages`
- `Manage Messages`
- `Use Slash Commands`

Go to the generated URL and invite the bot to your server.


## Setup secrets and KV namespaces

Login to Cloudflare with:

```
wrangler login
```

Store `DISCORD_TOKEN` to secrets:

```
wrangler secret put DISCORD_TOKEN
```

Create `PIN` namespaces. The id will be `PINS_KV_NAMESPACE_ID`:

```
wrangler kv:namespace create PINS
```

Create `OWNERS` namespaces. The id will be `OWNERS_KV_NAMESPACE_ID`:

```
wrangler kv:namespace create OWNERS
```


## Register commands

Create `.env` from `sample.env` and fill with credentials.

In the repository root, run:

```
yarn register-commands
```


## Deploy Cloudflare worker

Create `wrangler.toml` with:

```
yarn generate-wrangler
```

Deploy worker with:

```
yarn deploy
```

Bot can be tested on server with `/pin` command.