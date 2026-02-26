import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src';

describe('Booko-DAV worker', () => {
	it('responds with the UI (unit style)', async () => {
		const request = new Request('http://example.com');
		// Create an empty context to pass to `worker.fetch()`.
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
		await waitOnExecutionContext(ctx);
		expect(await response.text()).toContain('Booko-DAV');
	});

	it('responds with the UI (integration style)', async () => {
		const response = await SELF.fetch('http://example.com');
		expect(await response.text()).toContain('Booko-DAV');
	});
});
