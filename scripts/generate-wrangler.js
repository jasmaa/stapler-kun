/*
 * Generates `wrangler.toml` from env vars.
 */

require('dotenv').config();
const fs = require('node:fs');

const content = `name = "stapler-kun"
main = "src/index.ts"
compatibility_date = "2022-10-31"
node_compat = true

kv_namespaces = [
  { binding = "PINS", id = "${process.env.PINS_KV_NAMESPACE_ID}" },
  { binding = "OWNERS", id = "${process.env.OWNERS_KV_NAMESPACE_ID}" }
]

[triggers]
crons = ["*/30 * * * *"]

[observability]
enabled = true

[assets]
directory = "./assets"
binding = "ASSETS"

[vars]
DISCORD_APPLICATION_ID = "${process.env.DISCORD_APPLICATION_ID}"
DISCORD_PUBLIC_KEY = "${process.env.DISCORD_PUBLIC_KEY}"`;

fs.writeFileSync('wrangler.toml', content);