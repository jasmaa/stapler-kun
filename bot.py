import os
import asyncio
import datetime
import discord
import psycopg2
from dotenv import load_dotenv

load_dotenv()

database_url = os.getenv('DATABASE_URL')
sslmode = os.getenv('SSLMODE', default='require')

class Stapler(discord.Client):
    """Stapler bot
    """

    async def on_ready(self):
        print(f"Logged on as {self.user}")
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

                        expires = datetime.datetime.now() + datetime.timedelta(days=1)

                        conn = psycopg2.connect(database_url, sslmode=sslmode)
                        cur = conn.cursor()
                        cur.execute(
                            "INSERT INTO messages (message_id, channel_id, expires) VALUES(%s, %s, %s)",
                            (str(m.id), str(m.channel.id), expires),
                        )
                        conn.commit()
                        conn.close()

                        print(f"Pinned: {m.content}")
                    return

    async def unpin_messages(self):
        """Check and unpin expired messages from cache
        """
        while True:
            async with self.cache_lock:
                conn = psycopg2.connect(database_url, sslmode=sslmode)
                cur = conn.cursor()
                cur.execute(
                    "SELECT message_id, channel_id FROM messages WHERE expires < CURRENT_TIMESTAMP"
                )
                rows = cur.fetchall()

                for message_id, channel_id in rows:
                    # Unpin message
                    channel = self.get_channel(int(channel_id))
                    msg = await channel.fetch_message(int(message_id))
                    await msg.unpin()
                    print(f"Un-pinned: {msg.content}")

                    # Remove from store
                    cur.execute(
                        "DELETE FROM messages WHERE channel_id=%s AND message_id=%s",
                        (channel_id, message_id),
                    )
                conn.commit()
                conn.close()

            await asyncio.sleep(86400)


if __name__ == '__main__':

    try:
        conn = psycopg2.connect(database_url, sslmode=sslmode)
        cur = conn.cursor()
        cur.execute(
            "CREATE TABLE messages (message_id VARCHAR(255), channel_id VARCHAR(255), expires TIMESTAMP)")
        conn.commit()
        conn.close()
        print("Created table")
    except psycopg2.errors.DuplicateTable:
        print("Table already created")

    client = Stapler()
    print('Starting bot...')
    client.run(os.getenv('DISCORD_TOKEN'))
