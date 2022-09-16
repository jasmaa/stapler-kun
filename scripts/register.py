import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("DISCORD_TOKEN")
APPLICATION_ID = os.getenv("DISCORD_APPLICATION_ID")

with open('src/commands.json') as f:
    commands = json.load(f)
    res = requests.put(
        f"https://discord.com/api/v10/applications/{APPLICATION_ID}/commands",
        data=json.dumps(commands),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bot {TOKEN}",
        },
    )
    print(res.text)
