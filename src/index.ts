import { Router, Method } from 'tiny-request-router';
import { verifyKey } from 'discord-interactions';
import { handleDefault, handleInteraction, handleScheduledPinRemoval, handleStatic } from './handlers';

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;

	PINS: KVNamespace;
	OWNERS: KVNamespace;

	DISCORD_APPLICATION_ID: string;
	DISCORD_PUBLIC_KEY: string;
	DISCORD_TOKEN: string;

	ASSETS: {
		fetch: typeof fetch;
	};
}

const router = new Router();
router.get('/', handleDefault);
router.post('/', handleInteraction);
router.get('/static/(.*)', handleStatic);

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
			if (!signature || !timestamp) {
				console.error('Invalid Request');
				return new Response('Bad request signature.', { status: 401 });
			}
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

	async scheduled(
		controller: ScheduledController,
		env: Env,
		ctx: ExecutionContext
	): Promise<void> {
		console.log('starting scheduled pin cleanup...');
		await handleScheduledPinRemoval(env);
		console.log('done!');
	},
};