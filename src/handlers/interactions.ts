import { InteractionResponseFlags, InteractionResponseType } from 'discord-interactions';
import { DISCORD_API_BASEURL, EXPIRATION_OFFSET_SECONDS } from '../constants';
import { Env } from '../interfaces';
import { JsonResponse } from '../response';
import { timestamp2key, milliseconds2text, text2lines } from '../utils';
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

export async function handleTakeInteraction(message: any, env: Env): Promise<JsonResponse> {
  const guildId = message.guild_id;
  const newOwner = message.member.user.username;
  const getRes: any = await env.OWNERS.get(guildId, { type: 'json' });
  const now = Date.now();
  if (getRes) {
    const previousOwner = getRes.username;
    if (previousOwner === newOwner) {
      return new JsonResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `You already have the stapler...`,
          flags: InteractionResponseFlags.EPHEMERAL,
        },
      });
    } else {
      await env.OWNERS.put(guildId, JSON.stringify({
        username: newOwner,
        time: now,
      }));
      const diff = now - getRes.time;
      return new JsonResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `${newOwner} has taken the stapler from ${previousOwner}! ${previousOwner} had the stapler for ${milliseconds2text(diff)}.`,
        },
      });
    }
  } else {
    await env.OWNERS.put(guildId, JSON.stringify({
      username: newOwner,
      time: now,
    }));
    return new JsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `${newOwner} has taken the stapler!`,
      },
    });
  }
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

export async function handleGikosayInteraction(message: any, env: Env): Promise<JsonResponse> {
  const lineBreak = 35;
  const textBubbleBreak = 20;

  const text = message.data.options.find((option: any) => option.name === 'text').value;
  const rawLines = text2lines(text, lineBreak);
  const lines = rawLines.length === 0 ? [''] : rawLines;

  const textBubbleParts = [
    `　／${'￣'.repeat(textBubbleBreak)}`,
    ...lines.map((part, idx) => {
      if (idx < lines.length - 1) {
        return `　| ${part.trim()}`;
      } else {
        return `＜　${part.trim()}`;
      }
    }),
    `　＼${'＿'.repeat(textBubbleBreak)}`,
  ];

  const gikoParts = [
    "　　　　＿＿＿_∧∧　",
    "　～'　＿＿__(,,ﾟДﾟ)",
    "　　 ＵU 　 　Ｕ U　",
  ];

  const diff = textBubbleParts.length - gikoParts.length;
  for (let i = 0; i < diff; i++) {
    gikoParts.splice(0, 0, "　　　　　　　　　　");
  }

  let content = '';
  for (let i = 0; i < gikoParts.length; i++) {
    content += gikoParts[i] + textBubbleParts[i] + '\n';
  }

  return new JsonResponse({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `\`\`\`\n${content}\n\`\`\``,
    }
  });
}