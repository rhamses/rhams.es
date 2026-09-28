import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, r2, sandbox } from "@emdash-cms/cloudflare";
import { cloudflareEmail } from "@emdash-cms/cloudflare/plugins";
import { formsPlugin } from "@emdash-cms/plugin-forms";
import webhookNotifier from "@emdash-cms/plugin-webhook-notifier";
import AstroPWA from "@vite-pwa/astro";
import { defineConfig, fontProviders } from "astro/config";
import emdash from "emdash/astro";
import { fileURLToPath } from "node:url";

// With the Cloudflare adapter, public files go to dist/client.
const clientDir = fileURLToPath(new URL("./dist/client", import.meta.url));
const host = process.env.TAURI_DEV_HOST;
const isTauri = !!process.env.TAURI_ENV_PLATFORM;

export default defineConfig({
	site: "https://rhams.es",
	output: "server",
	adapter: cloudflare(),
	i18n: {
		defaultLocale: "pt",
		locales: ["pt", "en"],
		fallback: {
			en: "pt",
		},
		// Keep default (prefix-other-locales). Do not set prefixDefaultLocale —
		// it breaks /_emdash/admin (Astro injectRoute + i18n limitation).
	},
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			database: d1({ binding: "DB", session: "auto" }),
			storage: r2({ binding: "MEDIA" }),
			plugins: [
				formsPlugin(),
				cloudflareEmail({
					from: { email: "noreply@rhams.es", name: "Rhamsés Blog" },
					replyTo: "hello@rhams.es",
					binding: "EMAIL",
				}),
			],
			sandboxed: [webhookNotifier],
			sandboxRunner: sandbox(),
			marketplace: "https://marketplace.emdashcms.com",
		}),
		AstroPWA({
			disable: isTauri,
			outDir: clientDir,
			registerType: "autoUpdate",
			includeAssets: ["favicon.svg", "offline.html"],
			manifest: {
				name: "Rhamsés Blog",
				short_name: "rhams.es",
				description: "Artigos sobre engenharia de software e desenvolvimento web.",
				theme_color: "#0066cc",
				background_color: "#ffffff",
				display: "standalone",
				start_url: "/",
				icons: [
					{
						src: "favicon.svg",
						sizes: "any",
						type: "image/svg+xml",
						purpose: "any",
					},
				],
			},
			workbox: {
				globDirectory: clientDir,
				navigateFallback: "/offline.html",
				navigateFallbackDenylist: [/^\/_emdash/, /^\/rss\.xml/],
				globPatterns: ["**/*.{css,js,html,svg,png,ico,txt,woff,woff2,webp}"],
				globIgnores: ["**/PluginRegistry*.js"],
			},
			experimental: {
				directoryAndTrailingSlashHandler: true,
			},
		}),
	],
	fonts: [
		{
			provider: fontProviders.google(),
			name: "Inter",
			cssVariable: "--font-body",
			weights: [400, 500, 600, 700],
			fallbacks: ["sans-serif"],
		},
		{
			provider: fontProviders.google(),
			name: "JetBrains Mono",
			cssVariable: "--font-mono",
			weights: [400, 500],
			fallbacks: ["monospace"],
		},
	],
	devToolbar: { enabled: false },
	server: {
		host: host || false,
		port: 4321,
	},
	vite: {
		clearScreen: false,
		server: {
			strictPort: true,
			host: host || false,
			hmr: host
				? {
						protocol: "ws",
						host,
						port: 4322,
					}
				: undefined,
			watch: {
				ignored: ["**/src-tauri/**"],
			},
		},
	},
});
