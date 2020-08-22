import os
import asyncio
import discord
from dotenv import load_dotenv

load_dotenv()

class Stapler(discord.Client):
    """Stapler bot
    """

    async def on_ready(self):
        print(f'Logged on as {self.user}')

    async def on_message(self, message):
        # Ignore messages from self
        if message.author == self.user:
            return

        # Pin previous message
        if message.content == 'pin that':
            messages = await message.channel.history(limit=10).flatten()

            print([m.content for m in messages])

            for m in messages:
                if m.author != self.user and m.content != 'pin that':
                    await m.pin()
                    print(f'Pinned: {m.content}')
                    return


if __name__ == '__main__':
    client = Stapler()
    print('Starting bot...')
    client.run(os.getenv('DISCORD_TOKEN'))