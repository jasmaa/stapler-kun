import { Router, Method } from 'tiny-request-router';
import { verifyKey, InteractionType, InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;

	DISCORD_APPLICATION_ID: string;
	DISCORD_PUBLIC_KEY: string;
	DISCORD_TOKEN: string;
}

class JsonResponse extends Response {
	constructor(body: any, init?: any) {
		const jsonBody = JSON.stringify(body);
		init = init || {
			headers: {
				'content-type': 'application/json;charset=UTF-8',
			},
		};
		super(jsonBody, init);
	}
}

const DISCORD_API_BASEURL = "https://discord.com/api/v10";

const router = new Router();

router.get('/', (request: Request, env: Env) => {
	return new Response(env.DISCORD_APPLICATION_ID);
});

router.post('/', async (request: Request, env: Env) => {
	const message: any = await request.json();

	if (message.type === InteractionType.PING) {
		// The `PING` message is used during the initial webhook handshake, and is
		// required to configure the webhook in the developer portal.
		console.log('Handling Ping request');
		return new JsonResponse({
			type: InteractionResponseType.PONG,
		});
	}

	switch (message.data.name.toLowerCase()) {
		case 'test': {
			console.log('handling test request');
			return new JsonResponse({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: 'this is a test response',
				},
			});
		}
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
});

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {

		if (request.method === 'POST') {
			// Using the incoming headers, verify this request actually came from discord.
			const signature = request.headers.get('x-signature-ed25519');
			const timestamp = request.headers.get('x-signature-timestamp');
			const body = await request.clone().arrayBuffer();
			const isValidRequest = verifyKey(
				body,
				signature,
				timestamp,
				env.DISCORD_PUBLIC_KEY
			);
			if (!isValidRequest) {
				console.error('Invalid Request');
				return new Response('Bad request signature.', { status: 401 });
			}
		}

		const { pathname } = new URL(request.url);
		const match = router.match(request.method as Method, pathname);
		if (match) {
			return match.handler(request, env) as Response;
		} else {
			return new Response('Not found', { status: 404 });
		}
	},
};
