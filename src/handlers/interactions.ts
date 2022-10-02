import { InteractionResponseFlags, InteractionResponseType } from 'discord-interactions';
import { DISCORD_API_BASEURL, EXPIRATION_OFFSET_SECONDS } from '../constants';
import { Env } from '../interfaces';
import { JsonResponse } from '../response';
import { timestamp2key } from '../utils';
import bearFacts from '../bear-facts';

export async function handlePinInteraction(message: any, env: Env): Promise<JsonResponse> {
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

export async function handleStapleInteraction(message: any, env: Env): Promise<JsonResponse> {
  const videoUrl = 'https://www.youtube.com/watch?v=YG2_wmWc_QY';
  return new JsonResponse({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `[stable](${videoUrl})`,
    },
  });
}

export async function handleBearFactInteraction(message: any, env: Env): Promise<JsonResponse> {
  const bearFact = bearFacts[Math.floor(Math.random() * bearFacts.length)];
  return new JsonResponse({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `> ${bearFact.fact}`,
    },
  });
}