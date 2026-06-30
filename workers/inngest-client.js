/**
 * KineticOS — Inngest Client Factory (v3, Cloudflare Workers compatible)
 *
 * In Cloudflare Workers, process.env is not available.
 * The event key is passed at send() time, and the signing key at serve() time.
 * We construct a base client here; keys are injected per-request.
 */
import { Inngest } from 'inngest';

/**
 * Creates an Inngest client with the event key from the CF env binding.
 * @param {object} env - Cloudflare Workers env object
 */
export function createInngestClient(env) {
  return new Inngest({
    id: 'kineticos-diagnostic',
    eventKey: env.INNGEST_EVENT_KEY,
  });
}
