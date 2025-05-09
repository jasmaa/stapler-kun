import { InteractionResponseType, InteractionType } from "discord-interactions";
import { DISCORD_API_BASEURL } from "../constants";
import { Env } from "..";
import { JsonResponse } from "../response";
import { key2timestamp } from "../utils";
import { handleBearFactInteraction, handleGikosayInteraction, handleOpenBearBoxInteraction, handlePinInteraction, handleStapleInteraction, handleTakeInteraction } from "./interactions";

export function handleDefault(request: Request, env: Env) {
  return new Response(env.DISCORD_APPLICATION_ID);
}

export async function handleInteraction(request: Request, env: Env) {
  const message: any = await request.json();
  const url = request.url;

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
      return await handlePinInteraction(message, env);
    }
    case 'take': {
      console.log('handling take request');
      return await handleTakeInteraction(message, env);
    }
    case 'staple': {
      console.log('handling staple request');
      return await handleStapleInteraction(message, env);
    }
    case 'bear-fact': {
      console.log('handling bear-fact request');
      return await handleBearFactInteraction(message, env);
    }
    case 'gikosay': {
      console.log('handling gikosay request');
      return await handleGikosayInteraction(message, env);
    }
    case 'open-bear-box': {
      console.log('handling open-bear-box request');
      return await handleOpenBearBoxInteraction(message, env, url);
    }
    default:
      console.error('Unknown Command');
      return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
  }
}

export async function handleStatic(request: Request, env: Env) {
  console.log("handling static asset fetch...");
  return env.ASSETS.fetch(request);
}

export async function handleScheduledPinRemoval(env: Env) {
  let cursor;
  const now = Date.now();
  while (true) {
    const listPinsRes: any = await env.PINS.list({ cursor });
    for (const key of listPinsRes.keys) {
      const timestamp = key2timestamp(key.name);
      if (timestamp < now) {
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