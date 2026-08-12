/**
 * Push .emdash/seed.json content + local media to a remote EmDash instance.
 *
 * Usage:
 *   node scripts/push-seed-remote.mjs [--url https://rhamses-site.amb1.workers.dev]
 *
 * Auth: stored credentials from `emdash login`, or EMDASH_TOKEN.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { DatabaseSync } from "node:sqlite";
import { EmDashClient } from "emdash/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SEED_PATH = path.join(ROOT, ".emdash/seed.json");
const D1_PATH = path.join(
	ROOT,
	".wrangler/state/v3/d1/miniflare-D1DatabaseObject/e7352547963de7050bd7d94658afc4fe78b61811b7815da12d90be8e863abf4d.sqlite",
);
const R2_META = path.join(
	ROOT,
	".wrangler/state/v3/r2/miniflare-R2BucketObject/fdd428b8449a54ae447e957f6525f7e6b3724bd3efe64dd395c8bd1502cd4d62.sqlite",
);
const R2_BLOBS = path.join(ROOT, ".wrangler/state/v3/r2/my-emdash-media/blobs");
const SEED_ASSETS = path.join(ROOT, "seed/media/blog");

const urlArg = process.argv.find((a) => a.startsWith("--url="));
const BASE_URL = (urlArg?.slice(6) || process.env.EMDASH_URL || "https://rhamses-site.amb1.workers.dev").replace(
	/\/$/,
	"",
);

async function loadAuth(baseUrl) {
	if (process.env.EMDASH_TOKEN) {
		return { token: process.env.EMDASH_TOKEN };
	}
	const authPath = path.join(homedir(), ".config/emdash/auth.json");
	const raw = JSON.parse(await readFile(authPath, "utf8"));
	const entry = raw[baseUrl] || raw[`${baseUrl}/`];
	if (!entry?.accessToken) {
		throw new Error(`No stored auth for ${baseUrl}. Run: npx emdash login --url ${baseUrl}`);
	}
	return {
		token: entry.accessToken,
		refreshToken: entry.refreshToken,
		onTokenRefresh: async (accessToken) => {
			entry.accessToken = accessToken;
			const { writeFile } = await import("node:fs/promises");
			await writeFile(authPath, JSON.stringify(raw, null, 2));
		},
	};
}

function openDb(file) {
	return new DatabaseSync(file, { readOnly: true });
}

function buildLocalMediaIndex() {
	const mediaDb = openDb(D1_PATH);
	const r2Db = openDb(R2_META);
	const byStorageKey = new Map();
	const byFileId = new Map();

	const objects = new Map(
		r2Db.prepare("SELECT key, blob_id FROM _mf_objects").all().map((r) => [r.key, r.blob_id]),
	);

	for (const row of mediaDb.prepare("SELECT id, filename, storage_key, mime_type, alt FROM media").all()) {
		const blobId = objects.get(row.storage_key);
		if (!blobId) continue;
		const abs = path.join(R2_BLOBS, blobId);
		const meta = {
			id: row.id,
			filename: row.filename,
			storageKey: row.storage_key,
			mimeType: row.mime_type,
			alt: row.alt || "",
			abs,
		};
		byStorageKey.set(row.storage_key, meta);
		// URLs use storage_key stem or id variously
		byFileId.set(row.storage_key.replace(/\.[^.]+$/, ""), meta);
		byFileId.set(row.id, meta);
		const fileIdFromUrl = row.storage_key; // full key often appears in URL path basename
		byFileId.set(path.basename(row.storage_key, path.extname(row.storage_key)), meta);
	}

	return { byStorageKey, byFileId };
}

function collectMediaRefs(seed) {
	const refs = new Map(); // key → { filename?, url?, alt? }
	const walk = (node, alt = "") => {
		if (!node || typeof node !== "object") return;
		if (Array.isArray(node)) {
			for (const n of node) walk(n, alt);
			return;
		}
		if (node.$media) {
			const url = node.$media.url || "";
			const filename = node.$media.filename || "";
			const m = url.match(/\/media\/file\/([^/?#]+)/);
			const key = m?.[1] || filename;
			if (key) refs.set(key, { filename, url, alt: alt || "" });
		}
		if (node._type === "image" && node.asset?.url) {
			const url = node.asset.url;
			const m = url.match(/\/media\/file\/([^/?#]+)/);
			if (m) refs.set(m[1], { filename: m[1], url, alt: node.alt || "" });
		}
		for (const v of Object.values(node)) walk(v, alt);
	};
	walk(seed);
	return refs;
}

async function uploadAllMedia(client, seed, localIndex) {
	const refs = collectMediaRefs(seed);
	const uploaded = new Map(); // old basename/storage_key → MediaItem
	console.log(`\n→ Uploading ${refs.size} media files`);

	for (const [key, ref] of refs) {
		const stem = key.replace(/\.[^.]+$/, "");
		let local =
			localIndex.byStorageKey.get(key) ||
			localIndex.byFileId.get(stem) ||
			localIndex.byFileId.get(key);

		// Prefer seed/media/blog by filename when unique enough
		if (!local && ref.filename && ref.filename !== "capa.webp") {
			try {
				const { readdir } = await import("node:fs/promises");
				const { stat } = await import("node:fs/promises");
				async function findNamed(dir, name) {
					const entries = await readdir(dir, { withFileTypes: true });
					for (const e of entries) {
						const p = path.join(dir, e.name);
						if (e.isDirectory()) {
							const hit = await findNamed(p, name);
							if (hit) return hit;
						} else if (e.name === name) return p;
					}
					return null;
				}
				const abs = await findNamed(SEED_ASSETS, ref.filename);
				if (abs) {
					local = { filename: ref.filename, abs, alt: ref.alt };
				}
			} catch {
				/* ignore */
			}
		}

		if (!local) {
			console.warn(`  ! missing local media for ${key}`);
			continue;
		}

		const buf = await readFile(local.abs);
		const filename = local.filename || ref.filename || key;
		const media = await client.mediaUpload(buf, filename, {
			alt: local.alt || ref.alt || "",
			contentType: local.mimeType,
		});
		uploaded.set(key, media);
		uploaded.set(stem, media);
		if (local.storageKey) uploaded.set(local.storageKey, media);
		console.log(`  ↑ ${filename} → ${media.id}`);
	}
	return uploaded;
}

function rewriteMediaInData(data, uploaded, baseUrl) {
	const clone = structuredClone(data);

	const resolveUrl = (url) => {
		if (typeof url !== "string") return url;
		const m = url.match(/\/media\/file\/([^/?#]+)/);
		if (!m) return url;
		const media = uploaded.get(m[1]) || uploaded.get(m[1].replace(/\.[^.]+$/, ""));
		if (!media) return url;
		return media.url?.startsWith("http") ? media.url : `${baseUrl}${media.url}`;
	};

	const walk = (node) => {
		if (!node || typeof node !== "object") return node;
		if (Array.isArray(node)) return node.map(walk);

		if (node.$media) {
			const url = node.$media.url || "";
			const m = url.match(/\/media\/file\/([^/?#]+)/);
			const key = m?.[1] || node.$media.filename;
			const media = uploaded.get(key) || uploaded.get(String(key).replace(/\.[^.]+$/, ""));
			if (media) return { id: media.id };
			return node;
		}

		if (node._type === "image" && node.asset?.url) {
			return {
				...node,
				asset: { ...node.asset, url: resolveUrl(node.asset.url) },
			};
		}

		const out = {};
		for (const [k, v] of Object.entries(node)) out[k] = walk(v);
		return out;
	};

	return walk(clone);
}

async function ensureTerms(client, taxonomies) {
	console.log("\n→ Taxonomy terms");
	const index = {};
	for (const tax of taxonomies) {
		index[tax.name] = {};
		const existing = await client.terms(tax.name);
		for (const t of existing.items) index[tax.name][t.slug] = t;

		for (const term of tax.terms || []) {
			if (index[tax.name][term.slug]) continue;
			try {
				const created = await client.createTerm(tax.name, {
					slug: term.slug,
					label: term.label,
				});
				index[tax.name][term.slug] = created;
				console.log(`  + ${tax.name}/${term.slug}`);
			} catch (e) {
				console.warn(`  ! ${tax.name}/${term.slug}: ${e.message}`);
				const again = await client.terms(tax.name);
				for (const t of again.items) index[tax.name][t.slug] = t;
			}
		}
	}
	return index;
}

async function setTerms(client, collection, postId, taxonomies, termIndex) {
	if (!taxonomies) return;
	for (const [taxonomy, slugs] of Object.entries(taxonomies)) {
		const termIds = slugs.map((s) => termIndex[taxonomy]?.[s]?.id).filter(Boolean);
		if (!termIds.length) continue;
		await client.request("POST", `/content/${collection}/${postId}/terms/${taxonomy}`, {
			termIds,
		});
	}
}

async function upsertEntry(client, collection, entry, uploaded, termIndex, createdBySeedId) {
	const locale = entry.locale || "pt";
	const data = rewriteMediaInData(entry.data, uploaded, BASE_URL);

	let translationOf;
	if (entry.translationOf) {
		translationOf = createdBySeedId.get(entry.translationOf);
		if (!translationOf) {
			console.warn(`  ! missing translation source ${entry.translationOf} for ${entry.slug}:${locale}`);
		}
	}

	// Skip if already present for this locale
	try {
		const existing = await client.get(collection, entry.slug, { locale });
		if (existing?.id) {
			console.log(`  · exists ${collection}/${entry.slug}@${locale}`);
			createdBySeedId.set(entry.id, existing.id);
			return existing;
		}
	} catch {
		/* create */
	}

	const item = await client.create(collection, {
		slug: entry.slug,
		locale,
		...(translationOf ? { translationOf } : {}),
		data,
	});

	if (entry.status === "published") {
		await client.publish(collection, item.id);
	}

	await setTerms(client, collection, item.id, entry.taxonomies, termIndex);
	createdBySeedId.set(entry.id, item.id);
	console.log(`  ✓ ${collection}/${entry.slug}@${locale} → ${item.id}`);
	return item;
}

async function applySettings(client, settings) {
	if (!settings) return;
	console.log("\n→ Settings");
	await client.request("POST", "/settings", settings);
	console.log(`  ✓ ${settings.title}`);
}

async function main() {
	console.log(`Pushing seed → ${BASE_URL}`);
	const auth = await loadAuth(BASE_URL);
	const client = new EmDashClient({
		baseUrl: BASE_URL,
		token: auth.token,
		refreshToken: auth.refreshToken,
		onTokenRefresh: auth.onTokenRefresh,
	});

	const seed = JSON.parse(await readFile(SEED_PATH, "utf8"));
	const localIndex = buildLocalMediaIndex();
	const uploaded = await uploadAllMedia(client, seed, localIndex);
	const termIndex = await ensureTerms(client, seed.taxonomies || []);
	const createdBySeedId = new Map();

	await applySettings(client, seed.settings);

	for (const collection of ["pages", "posts"]) {
		const entries = seed.content?.[collection] || [];
		// Create translation sources first (no translationOf)
		const sources = entries.filter((e) => !e.translationOf);
		const translations = entries.filter((e) => e.translationOf);
		console.log(`\n→ ${collection} (${sources.length} sources, ${translations.length} translations)`);
		for (const entry of sources) {
			await upsertEntry(client, collection, entry, uploaded, termIndex, createdBySeedId);
		}
		for (const entry of translations) {
			await upsertEntry(client, collection, entry, uploaded, termIndex, createdBySeedId);
		}
	}

	const { items } = await client.list("posts", { status: "published", limit: 50 });
	console.log("\nDone. Published posts:", items.map((i) => `${i.locale || "?"}/${i.slug}`).join(", "));
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
