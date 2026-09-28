// Worker entry: Astro's fetch handler plus EmDash's scheduled() handler.
// Public HTML is stored in the Cache API and in KV. PluginBridge is the
// sandbox Durable Object, re-exported so its binding resolves.
import emdashWorker, { PluginBridge } from "@emdash-cms/cloudflare/worker";
import { publishVersion, publishVersionKey } from "./utils/content-version";

const EDGE_TTL_SECONDS = 60;
const KV_TTL_SECONDS = 60 * 60;
// Never a public URL: the key cannot collide with other apps in the isolate.
const CACHE_ORIGIN = "https://rhamses-site.internal/";
const GEN_KEY = "page-cache-generation";
const VERSION_PATH = "/_site/version";
const LOCALE_PATTERN = /^[a-z]{2,3}(?:-[A-Za-z]{2,4})?$/;
const PUBLISH_PATH = /^\/_emdash\/api\/content\/[^/]+\/[^/]+\/publish$/;
const BYPASS = [/^\/_emdash(?:\/|$)/, /^\/rss\.xml$/];

const edgeCache = () => (caches as unknown as { default: Cache }).default;

function isPublicGet(request: Request): boolean {
	if (request.method !== "GET" && request.method !== "HEAD") return false;
	const url = new URL(request.url);
	if (BYPASS.some((pattern) => pattern.test(url.pathname))) return false;
	const cookie = request.headers.get("cookie") ?? "";
	if (/(?:^|;\s*)(?:__em_|emdash|session|auth)/i.test(cookie)) return false;
	return true;
}

function cacheRequestFor(url: URL, generation: string): Request {
	const key = `${generation}:${url.pathname}${url.search}`;
	return new Request(CACHE_ORIGIN + encodeURIComponent(key));
}

async function cacheGeneration(env: Env): Promise<string> {
	return (await env.CACHE.get(GEN_KEY)) ?? "0";
}

async function versionResponse(url: URL, env: Env): Promise<Response> {
	const locale = url.searchParams.get("locale") ?? "";
	if (!LOCALE_PATTERN.test(locale)) {
		return Response.json({ error: "locale required" }, { status: 400 });
	}
	return Response.json(
		{ version: await publishVersion(env.CACHE, locale) },
		{ headers: { "cache-control": "no-store" } },
	);
}

async function publishedLocale(response: Response): Promise<string | null> {
	try {
		const body = (await response.json()) as { data?: { item?: { locale?: unknown } } };
		const locale = body.data?.item?.locale;
		return typeof locale === "string" && LOCALE_PATTERN.test(locale) ? locale : null;
	} catch {
		return null;
	}
}

async function bumpVersions(request: Request, response: Response, env: Env): Promise<void> {
	const now = String(Date.now());
	const writes = [env.CACHE.put(GEN_KEY, now)];
	if (request.method === "POST" && PUBLISH_PATH.test(new URL(request.url).pathname)) {
		const locale = await publishedLocale(response);
		if (locale) writes.push(env.CACHE.put(publishVersionKey(locale), now));
	}
	await Promise.all(writes);
}

function hasPrivateCookie(response: Response): boolean {
	const cookies =
		typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
	return cookies.some((cookie) => !cookie.toLowerCase().startsWith("__em_d1_bookmark="));
}

function isCacheableHtml(response: Response): boolean {
	if (!response.ok) return false;
	const type = response.headers.get("content-type") ?? "";
	if (!type.includes("text/html")) return false;
	const cacheControl = `${response.headers.get("cache-control") ?? ""} ${response.headers.get("cdn-cache-control") ?? ""}`;
	if (/no-store|private/i.test(cacheControl)) return false;
	return !hasPrivateCookie(response);
}

function storedResponse(body: string, source: Response, cacheStatus: string): Response {
	const headers = new Headers(source.headers);
	headers.delete("set-cookie");
	headers.set("content-type", source.headers.get("content-type") ?? "text/html; charset=utf-8");
	headers.set("cache-control", `public, max-age=${EDGE_TTL_SECONDS}`);
	headers.set("x-cache", cacheStatus);
	return new Response(body, { status: source.status, headers });
}

interface StoredPage {
	status: number;
	contentType: string;
	body: string;
}

const worker = {
	...emdashWorker,
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const origin = emdashWorker.fetch;
		if (!origin) return new Response("Not found", { status: 404 });

		const url = new URL(request.url);
		if (request.method === "GET" && url.pathname === VERSION_PATH) {
			return versionResponse(url, env);
		}

		if (!isPublicGet(request)) {
			const response = await origin.call(emdashWorker, request, env, ctx);
			if (request.method !== "GET" && request.method !== "HEAD" && response.ok) {
				ctx.waitUntil(bumpVersions(request, response.clone(), env));
			}
			return response;
		}

		const cache = edgeCache();
		const generation = await cacheGeneration(env);
		const cacheRequest = cacheRequestFor(url, generation);
		const edgeHit = await cache.match(cacheRequest);
		if (edgeHit) {
			const headers = new Headers(edgeHit.headers);
			headers.set("x-cache", "EDGE");
			return new Response(edgeHit.body, { status: edgeHit.status, headers });
		}

		const kvHit = await env.CACHE.get<StoredPage>(cacheRequest.url, "json");
		if (kvHit) {
			const response = new Response(kvHit.body, {
				status: kvHit.status,
				headers: {
					"content-type": kvHit.contentType,
					"cache-control": `public, max-age=${EDGE_TTL_SECONDS}`,
					"x-cache": "KV",
				},
			});
			ctx.waitUntil(cache.put(cacheRequest, response.clone()));
			return response;
		}

		const response = await origin.call(emdashWorker, request, env, ctx);
		if (request.method === "HEAD" || !isCacheableHtml(response)) return response;

		const body = await response.text();
		const contentType = response.headers.get("content-type") ?? "text/html; charset=utf-8";
		const cached = storedResponse(body, response, "MISS");
		const record: StoredPage = { status: response.status, contentType, body };
		ctx.waitUntil(
			Promise.all([
				cache.put(cacheRequest, cached.clone()),
				env.CACHE.put(cacheRequest.url, JSON.stringify(record), { expirationTtl: KV_TTL_SECONDS }),
			]),
		);
		return cached;
	},
} satisfies ExportedHandler<Env>;

export default worker;
export { PluginBridge };
