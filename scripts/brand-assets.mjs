#!/usr/bin/env node
// Generates favicons, PWA icons, iOS splash screens and Tauri icons from
// brand/ses.png. Requires ImageMagick (`magick`) on the PATH.
//
//   node scripts/brand-assets.mjs

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import splashScreens from "../src/utils/apple-splash-screens.json" with { type: "json" };

const LOGO = "brand/ses.png";
const BRAND_BG = "#000c1c";

const tmp = mkdtempSync(join(tmpdir(), "brand-"));

function magick(...args) {
	execFileSync("magick", args, { stdio: "inherit" });
}

// The source glow is cut at the image edges; fade them out so the logo
// blends into the background on large canvases.
const logo = join(tmp, "logo.png");
magick(
	LOGO,
	"(", "+clone", "-alpha", "off", "-fill", "black", "-colorize", "100",
	"-fill", "white", "-draw", "rectangle 36,36 629,592", "-blur", "0x20", ")",
	"-alpha", "off", "-compose", "CopyOpacity", "-composite",
	logo,
);

/** Logo centred on the brand background, scaled to `scale` of the shorter side. */
function canvas(out, width, height, scale, { palette = true } = {}) {
	const box = Math.round(Math.min(width, height) * scale);
	magick(
		"-size", `${width}x${height}`, `xc:${BRAND_BG}`,
		"(", logo, "-resize", `${box}x${box}`, ")",
		"-compose", "over", "-gravity", "center", "-composite",
		"-strip", "-alpha", "off", "-depth", "8",
		...(palette ? ["-colors", "256"] : []),
		"-define", "png:compression-level=9",
		out,
	);
}

// Site favicons and PWA icons. Maskable icons keep the logo inside the
// 80% safe zone.
canvas("public/icon-192.png", 192, 192, 0.84);
canvas("public/icon-512.png", 512, 512, 0.84);
canvas("public/icon-maskable-512.png", 512, 512, 0.6);
canvas("public/apple-touch-icon.png", 180, 180, 0.84);
for (const size of [16, 32, 48]) canvas(join(tmp, `favicon-${size}.png`), size, size, 0.96);
magick(...[16, 32, 48].map((s) => join(tmp, `favicon-${s}.png`)), "public/favicon.ico");

// iOS PWA startup images (portrait).
mkdirSync("public/splash", { recursive: true });
for (const { width, height, ratio } of splashScreens) {
	const w = width * ratio;
	const h = height * ratio;
	canvas(`public/splash/apple-splash-${w}x${h}.png`, w, h, 0.45);
}

// Tauri desktop shell shows the logo while the site loads.
canvas("desktop/logo.png", 480, 480, 1);

// Tauri app icons (desktop, and iOS/Android when src-tauri/gen exists).
canvas(join(tmp, "app-icon.png"), 1024, 1024, 0.84, { palette: false });
canvas(join(tmp, "android-fg.png"), 1024, 1024, 0.56, { palette: false });
magick("-size", "1024x1024", `xc:${BRAND_BG}`, join(tmp, "android-bg.png"));
writeFileSync(
	join(tmp, "icon.json"),
	JSON.stringify({
		default: "app-icon.png",
		bg_color: BRAND_BG,
		android_fg: "android-fg.png",
		android_bg: "android-bg.png",
	}),
);
execFileSync("npx", ["tauri", "icon", join(tmp, "icon.json")], { stdio: "inherit" });

// iOS launch screen image referenced by LaunchScreen.storyboard.
const splashSet = "src-tauri/gen/apple/Assets.xcassets/Splash.imageset";
if (existsSync("src-tauri/gen/apple")) {
	mkdirSync(splashSet, { recursive: true });
	const images = [1, 2, 3].map((scale) => {
		const filename = `splash@${scale}x.png`;
		canvas(join(splashSet, filename), 200 * scale, 200 * scale, 1);
		return { idiom: "universal", filename, scale: `${scale}x` };
	});
	writeFileSync(
		join(splashSet, "Contents.json"),
		`${JSON.stringify({ images, info: { author: "xcode", version: 1 } }, null, 2)}\n`,
	);
}

rmSync(tmp, { recursive: true, force: true });
