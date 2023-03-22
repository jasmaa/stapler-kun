import os
from dotenv import load_dotenv

load_dotenv()

text = f'''
name = "stapler-kun"
main = "src/index.ts"
compatibility_date = "2022-09-16"
node_compat = true

kv_namespaces = [
  {{ binding = "PINS", id = "{os.getenv('PINS_KV_NAMESPACE_ID')}" }},
  {{ binding = "OWNERS", id = "{os.getenv('OWNERS_KV_NAMESPACE_ID')}" }}
]

[triggers]
crons = ["*/30 * * * *"]

[vars]
DISCORD_APPLICATION_ID = "{os.getenv('DISCORD_APPLICATION_ID')}"
DISCORD_PUBLIC_KEY = "{os.getenv('DISCORD_PUBLIC_KEY')}"
'''

with open("wrangler.toml", "w") as f:
    f.write(text)
