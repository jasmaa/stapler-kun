import { InteractionResponseFlags, InteractionResponseType, InteractionType } from "discord-interactions";
import { DISCORD_API_BASEURL, EXPIRATION_OFFSET_SECONDS } from "./constants";
import { Env } from "./interfaces";
import { JsonResponse } from "./response";
import { key2timestamp, timestamp2key } from "./utils";

export function handleDefault(request: Request, env: Env) {
  return new Response(env.DISCORD_APPLICATION_ID);
}

export async function handleInteraction(request: Request, env: Env) {
  const message: any = await request.json();

  if (message.type === InteractionType.PING) {
    // The `PING` message is used during the initial webhook handshake, and is
    // required to configure the webhook in the developer portal.
    console.log('handling Ping request');
    return new JsonResponse({
      type: InteractionResponseType.PONG,
    });
  }

  switch (message.data.name.toLowerCase()) {
    case 'pin': {
      console.log('handling pin request');
      const channelId = message.channel_id;
      const getMessagesRes = await fetch(`${DISCORD_API_BASEURL}/channels/${channelId}/messages`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bot ${env.DISCORD_TOKEN}`,
        }
      });
      if (getMessagesRes.status !== 200) {
        return new JsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'Could not pin message. Ran into an error...',
            flags: InteractionResponseFlags.EPHEMERAL,
          },
        });
      }

      const getMessagesData: any[] = await getMessagesRes.json();
      if (getMessagesData.length < 1) {
        return new JsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'Could not pin message. No messages to pin.',
            flags: InteractionResponseFlags.EPHEMERAL,
          },
        });
      }

      const messageId = getMessagesData[0].id;

      const pinMessageRes = await fetch(`${DISCORD_API_BASEURL}/channels/${channelId}/pins/${messageId}`, {
        method: 'put',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bot ${env.DISCORD_TOKEN}`,
        }
      });
      if (pinMessageRes.status !== 204) {
        return new JsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'Could not pin message. Ran into an error...',
            flags: InteractionResponseFlags.EPHEMERAL,
          },
        });
      }

      const expirationTime = Date.now() + 1000 * EXPIRATION_OFFSET_SECONDS;
      const key = timestamp2key(expirationTime);
      await env.PINS.put(key, JSON.stringify({
        channelId,
        messageId,
      }));

      return new JsonResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'Done, boss!',
          flags: InteractionResponseFlags.EPHEMERAL,
        },
      });
    }
    default:
      console.error('Unknown Command');
      return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
  }
}

export async function handleScheduled(env: Env) {
  let cursor;
  const now = Date.now();
  while (true) {
    const listPinsRes: any = await env.PINS.list({ cursor });
    for (const key of listPinsRes.keys) {
      const timestamp = key2timestamp(key.name);
      if (now >= timestamp) {
        console.log(`deleting pin ${key.name}...`);
        const getPinRes: any = await env.PINS.get(key.name, { type: 'json' });
        const channelId = getPinRes.channelId;
        const messageId = getPinRes.messageId;
        // Makes best effort to unpin and deletes record
        const unpinMessageRes = await fetch(`${DISCORD_API_BASEURL}/channels/${channelId}/pins/${messageId}`, {
          method: 'delete',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bot ${env.DISCORD_TOKEN}`,
          }
        });
        await env.PINS.delete(key.name);
      } else {
        // Short-circuit since timestamps are out of range
        return;
      }
    }
    cursor = listPinsRes.cursor;
    if (!cursor) {
      // Short-circuit since no more items to read
      return;
    }
  }
}