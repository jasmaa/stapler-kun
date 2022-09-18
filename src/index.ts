import { Router, Method } from 'tiny-request-router';
import { verifyKey } from 'discord-interactions';
import { handleDefault, handleInteraction, handleScheduledPinRemoval } from './handlers';
import { Env } from './interfaces';

const router = new Router();
router.get('/', handleDefault);
router.post('/', handleInteraction);

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