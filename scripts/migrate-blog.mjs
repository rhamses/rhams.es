/**
 * Migrate posts from the old Astro blog (../blog) into this EmDash instance.
 *
 * Usage:
 *   node scripts/migrate-blog.mjs [--url http://localhost:4322]
 */
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EmDashClient } from "emdash/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BLOG_ROOT = path.resolve(ROOT, "../../blog");
const BLOG_POSTS = path.join(BLOG_ROOT, "src/data/blog-posts");
const BLOG_ASSETS = path.join(BLOG_ROOT, "public/assets/blog");
const SEED_ASSETS = path.join(ROOT, "seed/media/blog");

const urlArg = process.argv.find((a) => a.startsWith("--url="));
const BASE_URL = urlArg?.slice(6) || process.env.EMDASH_URL || "http://localhost:4322";

const DEMO_SLUGS = new Set([
	"building-for-the-long-term",
	"the-case-for-static",
	"learning-in-public",
	"small-tools-big-impact",
	"designing-with-constraints",
	"a-weekend-with-a-side-project",
	"notes-on-simplicity",
	"work-in-progress",
	"migration-test",
]);

const SKIP_FILES = new Set(["markdown-test.md"]);

/** @type {Record<string, { category: string[], tag: string[] }>} */
const TAXONOMY_MAP = {
	"ciencia-de-dados-e-matematica": { category: ["notes"], tag: ["opinion"] },
	"cloudflare-service-worker": { category: ["development"], tag: ["webdev", "tools"] },
	"como-animar-elementos-sem-usar-javascript-e-css": {
		category: ["development"],
		tag: ["webdev", "creativity"],
	},
	"consultando-a-tabela-fipe-via-api": { category: ["development"], tag: ["tools", "webdev"] },
	"criando-imagens-dinamicamente-com-sharp-e-nodejs": {
		category: ["development"],
		tag: ["webdev", "tools"],
	},
	"hello-world": { category: ["notes"], tag: ["opinion"] },
	"identificando-idiomas-atraves-do-javascript": {
		category: ["development"],
		tag: ["webdev"],
	},
	"web-components-exemplos-e-overview": { category: ["development"], tag: ["webdev"] },
};

function slugify(text) {
	return text
		.toString()
		.normalize("NFKD")
		.toLowerCase()
		.trim()
		.replace(/\s+/g, "-")
		.replace(/[^\w\-]+/g, "")
		.replace(/_/g, "-")
		.replace(/-+/g, "-")
		.replace(/-$/g, "");
}

function parseFrontmatter(raw) {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
	if (!match) return { meta: {}, body: raw };
	const meta = {};
	for (const line of match[1].split("\n")) {
		const idx = line.indexOf(":");
		if (idx === -1) continue;
		const key = line.slice(0, idx).trim();
		let value = line.slice(idx + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		meta[key] = value;
	}
	return { meta, body: match[2] };
}

function parsePublishDate(dateStr) {
	// e.g. "7 Dec 2023", "8 Jan 2021", "01 Dec 2021"
	const d = new Date(dateStr);
	if (Number.isNaN(d.getTime())) {
		throw new Error(`Invalid publishDate: ${dateStr}`);
	}
	// Noon UTC to avoid timezone day-shifts
	d.setUTCHours(12, 0, 0, 0);
	return d.toISOString();
}

function decodeEntities(text) {
	return text
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}

function htmlToMarkdown(html) {
	let md = html;

	// Remove imports / scripts
	md = md.replace(/^import\s+.+from\s+['"].+['"];?\s*$/gm, "");

	// TOC blocks
	md = md.replace(/<div class="wp-block-getwid-table-of-contents[\s\S]*?<\/div>/gi, "");

	// YouTube / embed figures → bare URL
	md = md.replace(
		/<figure[^>]*wp-block-embed[\s\S]*?(https?:\/\/[^\s<]+)[\s\S]*?<\/figure>/gi,
		"\n\n$1\n\n",
	);

	// Videos → markdown links
	md = md.replace(
		/<video[^>]*src=["']([^"']+)["'][^>]*>[\s\S]*?<\/video>/gi,
		"\n\n[Assistir vídeo]($1)\n\n",
	);
	md = md.replace(/<video[^>]*src=["']([^"']+)["'][^>]*\/?>/gi, "\n\n[Assistir vídeo]($1)\n\n");

	// iframes → links
	md = md.replace(
		/<iframe[^>]*src=["']([^"']+)["'][^>]*>[\s\S]*?<\/iframe>/gi,
		"\n\n[Abrir demo]($1)\n\n",
	);

	// Figures with img + optional figcaption
	md = md.replace(
		/<figure[^>]*>\s*<img[^>]*src=["']([^"']+)["'][^>]*\/?>\s*(?:<figcaption[^>]*>([\s\S]*?)<\/figcaption>)?\s*<\/figure>/gi,
		(_, src, caption) => {
			const alt = (caption || "").replace(/<[^>]+>/g, "").trim();
			return `\n\n![${alt}](${src})\n\n`;
		},
	);

	// Standalone images
	md = md.replace(/<img[^>]*src=["']([^"']+)["'][^>]*\/?>/gi, (_, src) => {
		const altMatch = _.match(/alt=["']([^"']*)["']/i);
		return `\n\n![${altMatch?.[1] || ""}](${src})\n\n`;
	});

	// Headings
	md = md.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, inner) => {
		const text = inner.replace(/<[^>]+>/g, "").trim();
		return `\n\n${"#".repeat(Number(level))} ${text}\n\n`;
	});

	// Links
	md = md.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, inner) => {
		const text = inner.replace(/<[^>]+>/g, "").trim() || href;
		return `[${text}](${href})`;
	});

	// Bold / italic / underline / code
	md = md.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**");
	md = md.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, "_$2_");
	md = md.replace(/<u[^>]*>([\s\S]*?)<\/u>/gi, "$1");
	md = md.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`");

	// Lists
	md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, inner) => {
		return (
			"\n" +
			inner
				.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, item) => {
					return `- ${item.replace(/<[^>]+>/g, "").trim()}\n`;
				})
				.trim() +
			"\n"
		);
	});

	// Paragraphs / breaks
	md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n\n$1\n\n");
	md = md.replace(/<br\s*\/?>/gi, "\n\n");
	md = md.replace(/<\/?center>/gi, "");
	md = md.replace(/<\/?div[^>]*>/gi, "\n");
	md = md.replace(/<\/?span[^>]*>/gi, "");

	// Strip leftover tags except those inside code fences (rough)
	md = md.replace(/<(?!\/?(?:pre|code)\b)[^>]+>/gi, "");

	md = decodeEntities(md);
	md = md.replace(/\n{3,}/g, "\n\n").trim();
	return md;
}

function normalizeAssetPath(src) {
	return src
		.replace(/^\/blog\/assets\/blog\//, "")
		.replace(/^\/assets\/blog\//, "")
		.replace(/^\//, "");
}

async function fileExists(p) {
	try {
		await stat(p);
		return true;
	} catch {
		return false;
	}
}

async function resolveAsset(relativePath) {
	const candidates = [
		path.join(SEED_ASSETS, relativePath),
		path.join(BLOG_ASSETS, relativePath),
	];
	for (const c of candidates) {
		if (await fileExists(c)) return c;
	}
	return null;
}

async function uploadFile(client, filePath, alt = "") {
	const buf = await readFile(filePath);
	const filename = path.basename(filePath);
	const media = await client.mediaUpload(buf, filename, { alt });
	console.log(`  ↑ media ${filename} → ${media.id}`);
	return media;
}

async function collectLocalAssetPaths(markdown) {
	const paths = new Set();
	const re = /!\[[^\]]*\]\(([^)]+)\)|\[[^\]]*\]\(([^)]+\.(?:png|jpe?g|webp|gif|mp4))\)/gi;
	let m;
	while ((m = re.exec(markdown))) {
		const src = m[1] || m[2];
		if (!src) continue;
		if (src.startsWith("http://") || src.startsWith("https://")) continue;
		paths.add(normalizeAssetPath(src));
	}
	return [...paths];
}

async function rewriteAssets(client, markdown, cache) {
	const locals = await collectLocalAssetPaths(markdown);
	let out = markdown;
	for (const rel of locals) {
		if (!cache.has(rel)) {
			const abs = await resolveAsset(rel);
			if (!abs) {
				console.warn(`  ! missing asset: ${rel}`);
				continue;
			}
			const media = await uploadFile(client, abs, path.basename(rel));
			cache.set(rel, media);
		}
		const media = cache.get(rel);
		const url = media.url.startsWith("http") ? media.url : `${BASE_URL}${media.url}`;
		// Rewrite both /blog/assets/blog/... and /assets/blog/...
		out = out
			.replaceAll(`/blog/assets/blog/${rel}`, url)
			.replaceAll(`/assets/blog/${rel}`, url)
			.replaceAll(`](${rel})`, `](${url})`);
	}
	return out;
}

async function deleteDemoPosts(client) {
	const { items } = await client.list("posts", { limit: 50 });
	for (const item of items) {
		if (DEMO_SLUGS.has(item.slug)) {
			await client.delete("posts", item.id);
			console.log(`  ✕ deleted demo post ${item.slug}`);
		}
	}
}

async function ensureTerms(client) {
	const cats = await client.terms("category");
	const tags = await client.terms("tag");
	const byTax = {
		category: Object.fromEntries(cats.items.map((t) => [t.slug, t])),
		tag: Object.fromEntries(tags.items.map((t) => [t.slug, t])),
	};
	return byTax;
}

async function setTerms(client, postId, taxonomies, termIndex) {
	for (const [taxonomy, slugs] of Object.entries(taxonomies)) {
		const termIds = slugs
			.map((slug) => termIndex[taxonomy]?.[slug]?.id)
			.filter(Boolean);
		if (termIds.length === 0) continue;
		await client.request(
			"POST",
			`/content/posts/${postId}/terms/${taxonomy}`,
			{ termIds },
		);
	}
}

async function updateAboutAndSettings(client) {
	console.log("\n→ Updating site settings");
	await client.request("POST", "/settings", {
		title: "Rhamsés Blog",
		tagline: "Artigos sobre engenharia de software e desenvolvimento web.",
	});

	console.log("→ Updating about page");
	const about = await client.get("pages", "about");
	await client.update("pages", about.id, {
		data: {
			title: "Sobre",
			content: `Olá, eu sou o **Rhamses**. Sou um Web engineer baseado no Brasil.

Você pode me seguir no [Twitter](https://www.twitter.com/rhamses), ver alguns trabalhos no [GitHub](https://www.github.com/rhamses), ou ler mais sobre mim em [rhams.es](https://rhams.es).

Este blog reúne anotações e artigos sobre software, web e o que eu estiver aprendendo.`,
		},
		_rev: about._rev,
	});
	await client.publish("pages", about.id);
}

async function loadPosts() {
	const files = await readdir(BLOG_POSTS);
	const posts = [];
	for (const file of files) {
		if (!/\.(mdx?|md)$/.test(file) || SKIP_FILES.has(file)) continue;
		const raw = await readFile(path.join(BLOG_POSTS, file), "utf8");
		const { meta, body } = parseFrontmatter(raw);
		const slug = path.basename(file).replace(/\.(mdx?|md)$/, "");
		// Normalize unicode slug variants
		const normalizedSlug = slug.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
		posts.push({
			file,
			slug: normalizedSlug,
			title: meta.title || slug,
			excerpt: meta.description || "",
			publishedAt: parsePublishDate(meta.publishDate),
			body,
		});
	}
	posts.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
	return posts;
}

async function featuredForPost(client, post, cache) {
	const titleSlug = slugify(post.title);
	const candidates = [
		`${titleSlug}/capa.webp`,
		`${titleSlug}/capa.jpg`,
		`${post.slug}/capa.webp`,
		`${post.slug}/capa.jpg`,
		"hello-world.jpeg",
	];
	for (const rel of candidates) {
		const abs = await resolveAsset(rel);
		if (!abs) continue;
		if (!cache.has(rel)) {
			cache.set(rel, await uploadFile(client, abs, post.title));
		}
		return cache.get(rel);
	}
	return null;
}

async function migratePost(client, post, termIndex, mediaCache) {
	console.log(`\n→ ${post.slug}`);

	// Skip if already migrated
	try {
		const existing = await client.get("posts", post.slug);
		if (existing && !DEMO_SLUGS.has(existing.slug)) {
			console.log(`  · already exists (${existing.id}), skipping`);
			return existing;
		}
	} catch {
		// not found — continue
	}

	let markdown = htmlToMarkdown(post.body);
	markdown = await rewriteAssets(client, markdown, mediaCache);

	const featured = await featuredForPost(client, post, mediaCache);

	const item = await client.create("posts", {
		slug: post.slug,
		publishedAt: post.publishedAt,
		data: {
			title: post.title,
			excerpt: post.excerpt,
			content: markdown,
			...(featured ? { featured_image: { id: featured.id } } : {}),
		},
	});

	await client.request("POST", `/content/posts/${item.id}/publish`, {
		publishedAt: post.publishedAt,
	});

	const tax = TAXONOMY_MAP[post.slug];
	if (tax) {
		await setTerms(client, item.id, tax, termIndex);
	}

	// SEO description from excerpt
	try {
		await client.request("PUT", `/content/posts/${item.id}/seo`, {
			description: post.excerpt,
		});
	} catch {
		// SEO endpoint may differ; non-fatal
	}

	const got = await client.get("posts", item.id);
	console.log(`  ✓ published ${got.slug} @ ${got.publishedAt}`);
	return got;
}

async function main() {
	console.log(`Migrating blog → ${BASE_URL}`);
	const client = new EmDashClient({ baseUrl: BASE_URL, devBypass: true });

	console.log("\n→ Removing demo seed posts");
	await deleteDemoPosts(client);

	const termIndex = await ensureTerms(client);
	const posts = await loadPosts();
	console.log(`\nFound ${posts.length} posts to migrate`);

	const mediaCache = new Map();
	for (const post of posts) {
		await migratePost(client, post, termIndex, mediaCache);
	}

	await updateAboutAndSettings(client);

	console.log("\nDone.");
	const { items } = await client.list("posts", { status: "published", limit: 50 });
	console.log(
		"Published posts:",
		items.map((i) => i.slug).join(", "),
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
