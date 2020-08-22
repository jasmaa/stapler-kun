import os
import discord
from dotenv import load_dotenv

load_dotenv()

if __name__ == '__main__':
    print(f'{discord.utils.oauth_url(os.getenv("CLIENT_ID"), discord.Permissions(10240))}')