import os
import asyncio
import datetime
import discord
from dotenv import load_dotenv

load_dotenv()

class Stapler(discord.Client):
    """Stapler bot
    """

    async def on_ready(self):
        print(f"Logged on as {self.user}")
        self.msg_cache = []
        self.cache_lock = asyncio.Lock()
        self.loop.create_task(self.unpin_messages())

    async def on_message(self, message):
        # Ignore messages from self
        if message.author == self.user:
            return

        # Pin previous message
        if message.content == 'pin that':

            messages = await message.channel.history(limit=100).flatten()

            for m in messages:
                if m.author != self.user and m.content != 'pin that':
                    async with self.cache_lock:
                        await m.pin()
                        self.msg_cache.append({
                            'message': m,
                            'expires': datetime.datetime.now() + datetime.timedelta(1, 0),
                        })
                        print(f"Pinned: {m.content}")
                    return
    
    async def unpin_messages(self):
        """Check and unpin expired messages from cache
        """
        while True:
            async with self.cache_lock:
                now = datetime.datetime.now()
                for pinned_msg in self.msg_cache:
                    if now > pinned_msg['expires']:
                        await pinned_msg['message'].unpin()
                        self.msg_cache.remove(pinned_msg)
                        print(f"Un-pinned: {pinned_msg['message'].content}")
            await asyncio.sleep(86400)


if __name__ == '__main__':
    client = Stapler()
    print('Starting bot...')
    client.run(os.getenv('DISCORD_TOKEN'))
