import { InteractionResponseFlags, InteractionResponseType, InteractionType } from "discord-interactions";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { env, fetchMock } from "cloudflare:test";
import { Env } from "..";
import { timestamp2key } from "../utils";
import { handleDefault, handleInteraction, handleScheduledPinRemoval } from ".";

declare module "cloudflare:test" {
  interface ProvidedEnv extends Env { }
}

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(1663516715115);

  fetchMock.activate();
  fetchMock.disableNetConnect();
});

describe('test handleDefault', () => {
  it('should return response', async () => {
    const req = new Request('http://localhost/');

    const res = await handleDefault(req, env);

    const text = await res.text();
    expect(res.status).toBe(200);
    expect(text).toBe(env.DISCORD_APPLICATION_ID);
  });
});

describe('test handleInteraction', () => {
  const guildId = 'guild000';
  const channelId = 'channelId123';
  const messageId = 'messageId456';

  it('when receive PING should respond PONG', async () => {
    const req = new Request('http://localhost/', {
      method: 'post',
      body: JSON.stringify({
        type: InteractionType.PING
      })
    });

    const res = await handleInteraction(req, env);

    const json: any = await res.json();
    expect(res.status).toBe(200);
    expect(json.type).toBe(InteractionResponseType.PONG);
  });

  describe('test `pin`', () => {
    it('when receive pin command should pin previous message', async () => {
      const origin = fetchMock.get('https://discord.com');
      origin
        .intercept({ path: `/api/v10/channels/${channelId}/messages`, method: 'GET' })
        .reply(200, [
          {
            id: messageId,
          }
        ]);
      origin
        .intercept({ path: `/api/v10/channels/${channelId}/pins/${messageId}`, method: 'PUT' })
        .reply(204);

      const req = new Request('http://localhost/', {
        method: 'post',
        body: JSON.stringify({
          type: InteractionType.APPLICATION_COMMAND,
          channel_id: channelId,
          data: {
            name: 'pin',
          },
        })
      });

      const res = await handleInteraction(req, env);

      const json: any = await res.json();
      expect(res.status).toBe(200);
      expect(json.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(json.data.content).toBe('Done, boss!');
      expect(json.data.flags).toBe(InteractionResponseFlags.EPHEMERAL);

      const listRes = await env.PINS.list();
      expect(listRes.keys.length).toBe(1);
    });

    it('when receive pin command when no messages should respond with error', async () => {
      const origin = fetchMock.get('https://discord.com');
      origin
        .intercept({ path: `/api/v10/channels/${channelId}/messages`, method: 'GET' })
        .reply(200, []);

      const req = new Request('http://localhost/', {
        method: 'post',
        body: JSON.stringify({
          type: InteractionType.APPLICATION_COMMAND,
          channel_id: channelId,
          data: {
            name: 'pin',
          },
        })
      });

      const res = await handleInteraction(req, env);

      const json: any = await res.json();
      expect(res.status).toBe(200);
      expect(json.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(json.data.content).toBe('Could not pin message. No messages to pin.');
      expect(json.data.flags).toBe(InteractionResponseFlags.EPHEMERAL);

      const listRes = await env.PINS.list();
      expect(listRes.keys.length).toBe(0);
    });

    it('when receive pin command when channel not found should respond with error', async () => {
      const origin = fetchMock.get('https://discord.com');
      origin
        .intercept({ path: `/api/v10/channels/${channelId}/messages`, method: 'GET' })
        .reply(404, {});
      origin
        .intercept({ path: `/api/v10/channels/${channelId}/pins/${messageId}`, method: 'PUT' })
        .reply(204);

      const req = new Request('http://localhost/', {
        method: 'post',
        body: JSON.stringify({
          type: InteractionType.APPLICATION_COMMAND,
          channel_id: channelId,
          data: {
            name: 'pin',
          },
        })
      });

      const res = await handleInteraction(req, env);

      const json: any = await res.json();
      expect(res.status).toBe(200);
      expect(json.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(json.data.content).toBe('Could not pin message. Ran into an error...');
      expect(json.data.flags).toBe(InteractionResponseFlags.EPHEMERAL);

      const listRes = await env.PINS.list();
      expect(listRes.keys.length).toBe(0);
    });
  });

  describe('test `take`', () => {
    it('when receive take command when no owner should let sender take stapler', async () => {
      const req = new Request('http://localhost/', {
        method: 'post',
        body: JSON.stringify({
          type: InteractionType.APPLICATION_COMMAND,
          guild_id: guildId,
          channel_id: channelId,
          member: { user: { username: 'alice' } },
          data: {
            name: 'take',
          },
        })
      });

      const res = await handleInteraction(req, env);

      const json: any = await res.json();
      expect(res.status).toBe(200);
      expect(json.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(json.data.content).toBe('alice has taken the stapler!')
      expect(json.data.flags).toBeFalsy();

      const getRes = await env.OWNERS.get(guildId);
      expect(getRes).toBeTruthy();
    });

    it('when receive take command when sender is not owner should let sender take stapler from owner', async () => {
      await env.OWNERS.put(guildId, JSON.stringify({
        username: 'alice',
        time: 0,
      }));
      const diff = Date.now(); // Date.now() - 0

      const req = new Request('http://localhost/', {
        method: 'post',
        body: JSON.stringify({
          type: InteractionType.APPLICATION_COMMAND,
          guild_id: guildId,
          channel_id: channelId,
          member: { user: { username: 'bob' } },
          data: {
            name: 'take',
          },
        })
      });

      const res = await handleInteraction(req, env);

      const json: any = await res.json();
      expect(res.status).toBe(200);
      expect(json.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(json.data.content).toContain(`bob has taken the stapler from alice! alice had the stapler for`)
      expect(json.data.flags).toBeFalsy();
    });

    it('when receive take command when sender is already owner should tell sender that they are owner', async () => {
      await env.OWNERS.put(guildId, JSON.stringify({
        username: 'alice',
        time: 0,
      }));

      const req = new Request('http://localhost/', {
        method: 'post',
        body: JSON.stringify({
          type: InteractionType.APPLICATION_COMMAND,
          guild_id: guildId,
          channel_id: channelId,
          member: { user: { username: 'alice' } },
          data: {
            name: 'take',
          },
        })
      });

      const res = await handleInteraction(req, env);

      const json: any = await res.json();
      expect(res.status).toBe(200);
      expect(json.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(json.data.content).toBe('You already have the stapler...')
      expect(json.data.flags).toBe(InteractionResponseFlags.EPHEMERAL);
    });

    it('when receive take command when different owner in another guild should not affect other guild', async () => {
      const otherGuildId = 'gamingFunClub000';
      await env.OWNERS.put(otherGuildId, JSON.stringify({
        username: 'barbatos',
        time: 0,
      }));

      const req = new Request('http://localhost/', {
        method: 'post',
        body: JSON.stringify({
          type: InteractionType.APPLICATION_COMMAND,
          guild_id: guildId,
          channel_id: channelId,
          member: { user: { username: 'alice' } },
          data: {
            name: 'take',
          },
        })
      });

      const res = await handleInteraction(req, env);

      const json: any = await res.json();
      expect(res.status).toBe(200);
      expect(json.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(json.data.content).toBe('alice has taken the stapler!')
      expect(json.data.flags).toBeFalsy();

      const getRes1 = await env.OWNERS.get(guildId);
      expect(getRes1).toBeTruthy();
      const getRes2 = await env.OWNERS.get(otherGuildId, { type: 'json' }) as { username: string, time: number };
      expect(getRes2.username).not.toBe('alice');
    });
  });

  describe('test `staple`', () => {
    it('when receive staple command should stable', async () => {
      const req = new Request('http://localhost/', {
        method: 'post',
        body: JSON.stringify({
          type: InteractionType.APPLICATION_COMMAND,
          channel_id: channelId,
          data: {
            name: 'staple',
          },
        })
      });

      const res = await handleInteraction(req, env);

      const json: any = await res.json();
      expect(res.status).toBe(200);
      expect(json.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(json.data.content).toBe('[stable](https://www.youtube.com/watch?v=YG2_wmWc_QY)')
      expect(json.data.flags).toBeFalsy();
    });
  });

  describe('test `bear-fact`', () => {
    it('when receive bear-fact command should respond with bear fact', async () => {
      const req = new Request('http://localhost/', {
        method: 'post',
        body: JSON.stringify({
          type: InteractionType.APPLICATION_COMMAND,
          channel_id: channelId,
          data: {
            name: 'bear-fact',
          },
        })
      });

      const res = await handleInteraction(req, env);

      const json: any = await res.json();
      expect(res.status).toBe(200);
      expect(json.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(json.data.content).not.toBeFalsy();
      expect(json.data.flags).toBeFalsy();
    });
  });

  describe('test `open-bear-box`', () => {
    it('when receive open-bear-fact command should respond with a bear box entry', async () => {
      const req = new Request('http://localhost/', {
        method: 'post',
        body: JSON.stringify({
          type: InteractionType.APPLICATION_COMMAND,
          channel_id: channelId,
          data: {
            name: 'open-bear-box',
          },
        })
      });

      const res = await handleInteraction(req, env);

      const json: any = await res.json();
      expect(res.status).toBe(200);
      expect(json.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(json.data.content).not.toBeFalsy();
      expect(json.data.embeds.length).toBe(1);
      expect(json.data.flags).toBeFalsy();
    });
  });
});

describe('test handleScheduledPinRemoval', () => {
  const records = [
    {
      // expired
      timestamp: 915235200000, // UNIX epoch in milliseconds
      channelId: 'channelId123',
      messageId: 'messageId123'
    },
    {
      // expired
      timestamp: 1081555200000,
      channelId: 'channelId123',
      messageId: 'messageId123'
    },
    {
      // not expired
      timestamp: 1664236800000,
      channelId: 'channelId123',
      messageId: 'messageId123'
    },
    {
      // not expired
      timestamp: 3475440000000,
      channelId: 'channelId123',
      messageId: 'messageId123'
    },
    {
      // expired
      timestamp: -9504000000,
      channelId: 'channelId123',
      messageId: 'messageId123'
    },
  ];

  it('when namespace has single pin with expired timestamp should unpin message', async () => {
    const expiredRecord = records[0];
    await env.PINS.put(timestamp2key(expiredRecord.timestamp), JSON.stringify({
      channelId: expiredRecord.channelId,
      messageId: expiredRecord.messageId,
    }));

    const origin = fetchMock.get('https://discord.com');
    origin
      .intercept({ path: `/api/v10/channels/${expiredRecord.channelId}/pins/${expiredRecord.messageId}`, method: 'DELETE' })
      .reply(204);

    await handleScheduledPinRemoval(env);

    expect(expiredRecord.timestamp <= Date.now());

    const listRes = await env.PINS.list();
    expect(listRes.keys.length).toBe(0);
  });

  it('when namespace has no pins should not unpin', async () => {
    await handleScheduledPinRemoval(env);

    const listRes = await env.PINS.list();
    expect(listRes.keys.length).toBe(0);
  });

  it('when namespace has multiple pins with non-expired timestamps should not unpin', async () => {
    for (const record of records) {
      if (record.timestamp >= Date.now()) {
        await env.PINS.put(timestamp2key(record.timestamp), JSON.stringify({
          channelId: record.channelId,
          messageId: record.messageId,
        }));
      }
    }

    const origin = fetchMock.get('https://discord.com');
    for (const record of records) {
      origin
        .intercept({ path: `/api/v10/channels/${record.channelId}/pins/${record.messageId}`, method: 'DELETE' })
        .reply(204);
    }

    await handleScheduledPinRemoval(env);

    const listRes = await env.PINS.list();
    expect(listRes.keys.length).toBe(2);
  });

  it('when namespace has multiple pins with non-expired and expired timestamps should unpin expired', async () => {
    for (const record of records) {
      await env.PINS.put(timestamp2key(record.timestamp), JSON.stringify({
        channelId: record.channelId,
        messageId: record.messageId,
      }));
    }

    const origin = fetchMock.get('https://discord.com');
    for (const record of records) {
      origin
        .intercept({ path: `/api/v10/channels/${record.channelId}/pins/${record.messageId}`, method: 'DELETE' })
        .reply(204);
    }

    await handleScheduledPinRemoval(env);

    const listRes = await env.PINS.list();
    expect(listRes.keys.length).toBe(2);
  });
});