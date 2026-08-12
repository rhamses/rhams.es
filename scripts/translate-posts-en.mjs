/**
 * Create English translations for remaining PT posts.
 * Usage: node scripts/translate-posts-en.mjs
 */
import { EmDashClient } from "emdash/client";

const BASE = process.env.EMDASH_URL || "http://localhost:4322";

/** @type {Record<string, { title: string; excerpt: string; content: string }>} */
const EN = {
	"ciencia-de-dados-e-matematica": {
		title: "Data Science and Mathematics",
		excerpt: "For me, a much bigger challenge than learning to code.",
		content: `Many years ago I decided that programming would be a natural next step from the *"Web Designer"* job I'd been doing for almost three years. To pick up more *freelancer* work I got into WordPress and gradually dug into PHP until I could call myself a "WordPress developer" — ask me for a custom post type, but don't ask me for a dedicated class to handle images. That's how I approached programming for the last 15 years: Python showed up, then JS frameworks, Node.js, and with them a lot of Linux infrastructure, CI/CD, and so on.

## And now for something completely different.

Data has always been a curiosity of mine. From political polls on TV talking about the famous "margin of error plus or minus" — which always made me suspicious (why 2 points and not 4 or 6? And why plus *or* minus? Did nobody settle on an answer?) — to the arrival of infographics, when I got fascinated by the unlimited creativity used to illustrate every kind of dataset, even when the unconventional layout made them impossible to read.

Following the rapid rise of *Machine Learning* and AI, plus curiosity in fields like journalism, politics, and sports, and a bit of experience working alongside data teams at companies I've been through, it's increasingly clear that this is my next challenge: Data Science and everything around it — because the foundation of that field is exactly my weakness: Mathematics. And that changes everything.

## How do you learn to learn?

Look, I don't just "struggle" with this subject — I have a full-blown fear of it, an actual trigger. I'll never forget that my highest grade in geometry was a hard-earned 3 out of 10, and that matters because visualizing problems is something I keep seeing as essential when I research math topics.

So I'm looking for every bit of help I can get. Unlike programming, where being self-taught is a core skill for keeping up with new tools, in data science I need as many mentors as possible to absorb years of mathematical knowledge I currently have no idea how to approach.

Right now I'm taking a distance-learning course and an elective on Data Science. To rebuild my math from zero I'm following Khan Academy tracks. On Amazon I have a few books waiting to be bought, and on YouTube the number of videos on the subject just keeps growing.

## Accountability — why not?

Another thing that always works is asking friends for help staying accountable. That's what I'm doing here too — asking for your help to stay on track with my studies. I'll use this space to document everything I learn in this field.

Thanks, and see you soon. 😄
`,
	},

	"como-animar-elementos-sem-usar-javascript-e-css": {
		title: "How to animate elements without JavaScript (and CSS!)",
		excerpt: "SVG animations with animateMotion — no JavaScript and almost no CSS.",
		content: `Sometimes we need simple animations and end up reaching for heavier solutions — whole JavaScript libraries or clever [CodePen](https://codepen.io/) tricks — when we could just use SVG.

[SVG](https://en.wikipedia.org/wiki/SVG) is a world of its own in the web stack. People mostly know it for icons, but it's also a great platform for everything from [animations](https://lottiefiles.com/animation/svg) to page transitions.

## Inspiration

I found this tweet showing the \`animateMotion\` property I had never heard of.

https://twitter.com/PaulieScanlon/status/1624905433306566656

So I decided to build my own example and read more about it on [MDN](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/animateMotion#example). Basically, \`animateMotion\` tells an SVG element to travel along another path element.

The basic MDN example looks like this:

\`\`\`xml
<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
  <path
    fill="none"
    stroke="lightgrey"
    d="M20,50 C20,-50 180,150 180,50 C180-50 20,150 20,50 z" />

  <circle r="5" fill="red">
    <animateMotion
      dur="10s"
      repeatCount="indefinite"
      path="M20,50 C20,-50 180,150 180,50 C180-50 20,150 20,50 z" />
  </circle>
</svg>
\`\`\`

Inside the SVG the idea is simple: the first shape is a \`<path>\`, and the second is a \`<circle>\` with \`animateMotion\` telling the circle to follow that path for 10 seconds. What connects them is the \`path\` attribute on \`animateMotion\`, which must match the \`d\` attribute on the path — the coordinates that draw the shape.

## Trying a different shape

I wanted something different, like a race on a track, so I found an SVG of Interlagos in São Paulo and combined it with a race-car SVG.

Because the assets came from different places, I dropped them into Figma and framed the composition the way I wanted.

I exported a new SVG, then built a group with three different cars, each with its own \`animateMotion\`. I added a \`begin\` attribute for a small delay between cars and \`rotate="auto"\` so each car turns along the path — and that was it.

## Improvements

It's far from perfect — I don't know much about SVG and mostly wanted to see the animation running. I'd love to keep the cars fully on the track and prevent them from leaving the canvas at the edges. If you know how, ping me.

## Links and references

- [Final code on my gist](https://gist.github.com/rhamses/9645d935ce111274e63ee79b0557adfd)
- [Working CodePen](https://codepen.io/rhamses/full/poOzQBy)
- [Sara Drasner is excellent at teaching SVG](https://www.youtube.com/watch?v=4laPOtTRteI)
`,
	},

	"consultando-a-tabela-fipe-via-api": {
		title: "Querying the FIPE table via API",
		excerpt: "A new way to query the Brazilian FIPE vehicle price table programmatically.",
		content: `The [FIPE table](https://veiculos.fipe.org.br) is a great research resource if you own a car or plan to buy one. Standardizing average market prices for new and used cars makes negotiation easier and, in a way, feeds pricing across the whole automotive product chain.

That's why so many people want this data as an API they can plug into their own apps. The problem is that FIPE (yes, that's the foundation's name, not just the price table) does not publish structured data for programmatic queries.

There are a few community APIs online, but they all struggle with something: stale data, slow endpoints, painful setup, and so on…

## **[Enter my idea → fipe.amb1.io](https://fipe.amb1.io)**

PLACEHOLDER_VIDEO_1

### How the data is acquired

The first decision was **not** to rely on the existing FIPE website structure. That meant scraping with Python and storing the results in a MongoDB instance.

### Search with autocomplete

The usual step-by-step brand → model → version flow felt rigid. I wanted something more organic, like **autocomplete**. So instead of picking everything in sequence, you search the vehicle and version first, then select the year separately.

PLACEHOLDER_IMG_1

### Price list

For each vehicle found you can get every price **for 2023**, starting from January/2023. The site also shows appreciation/depreciation percentages relative to the previous month and to the start of the year, so you can sense where each model's prices are heading.

PLACEHOLDER_IMG_2

## But… where's the API?

The site is a redesign of how a vehicle price search experience could work. Under the hood it's a set of custom endpoints for each entity:

- Brands
- Models
- Model variants (for example C3 Tendance vs Exclusive)
- Variant prices

Queries require an access key. For now you can grab the key from the site itself and inspect the requests it makes to learn how the API works.

PLACEHOLDER_VIDEO_2

Soon you'll be able to register for a personal key and fetch both historical and current data automatically. Sign up at the bottom of the site to get an email when that ships 😄

### Stack

- [MongoDB Atlas](http://mongodb.com) with [Data API](https://www.mongodb.com/docs/atlas/app-services/data-api/) for storage and BaaS
- [Python](https://www.python.org) for scraping and general data work
- [Nuxt](http://nuxt.com) for the UI and state management
`,
	},

	"cloudflare-service-worker": {
		title: "Cloudflare Service Worker",
		excerpt:
			"Manipulate your site without a backend. Get ready for edge computing.",
		content: `Imagine intercepting requests to your site without running a web server. A/B tests, traffic redirects — no Apache or Nginx config edits. Those are some of the things **edge computing** unlocks.

## Edge computing and Workers

It describes scripts that run close to the client that made the request. [Cloudflare was first](https://blog.cloudflare.com/introducing-cloudflare-workers/) to ship this approach back in 2017, and other platforms have followed. The main wins:

- Performance: responses happen near the user's geography, often under **50ms**
- Cost: there's a free Cloudflare Worker tier that covers many use cases; paid plans start around **$5/month**
- Simplicity: if you know JavaScript, you're set. You use the same Web Worker API browsers already support — no traditional web server to babysit.

## Example: redirecting a subdomain to custom routes

A real example I needed was this blog's route. It originally lived on Cloudflare Pages at \`rhamses-blog.pages.dev\`, but I wanted it at [**rhams.es/blog**](https://rhams.es/blog).

### Creating a Cloudflare Pages project

First I created a Cloudflare Pages project. The blog used to live on [**Netlify**](https://netlify.com), but I moved it to Cloudflare for stack compatibility. The flow is familiar: connect GitHub or upload the build output. When it finishes you get a Pages subdomain.

PLACEHOLDER_IMG_1

### Creating a Worker for the redirect

Now the interesting part. A Worker is just JavaScript following the [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) conventions.

PLACEHOLDER_IMG_2

In the dashboard you can try requests in the mini browser on the right and inspect output in the console below it.

PLACEHOLDER_IMG_3

I published a [gist with the full commented code](https://gist.github.com/rhamses/ceb7f8f97fed90706fa01f1f001a1409). In short it:

- Intercepts the request for \`rhams.es/blog\`
- Rewrites it to the origin host \`rhamses-blog.pages.dev\`
- Returns the HTML page to the client
- Does all of that in under 50ms

### Worker created — what next?

You still need to attach your domain to the Worker. If the domain is already on Cloudflare, creating a route finishes the loop.

You can do it via **Workers Routes** on the domain page

PLACEHOLDER_IMG_4

or via the **Routes** menu on the Worker itself.

PLACEHOLDER_IMG_5

I configured every HTTP/HTTPS call matching \`*rhams.es/blog*\` to hit the Worker.

**Watch the wildcards (*) at the start and end — no trailing slash.**

If everything is wired correctly, the blog is reachable at https://rhams.es/blog and SEO/sitemaps can treat that as the canonical URL.

## Things to watch

- For this deploy I had to reconfigure the blog to run under \`/blog\` instead of the domain root.
- Route changes take a few seconds to propagate — don't panic if it's not instant.
- Double-check DNS and prefer Cloudflare's managed flows for certificates.
- [Browse Workers examples for inspiration](https://developers.cloudflare.com/workers/examples/)
`,
	},

	"web-components-exemplos-e-overview": {
		title: "Web Components — examples and overview",
		excerpt: "How to use Web Components day to day",
		content: `Web Components are already part of everyday work. Many of us ship React, Vue, or Angular every day — but what if we want that same flexibility in a plain HTML project?

## How it works

A Web Component combines three specs: **Custom Elements**, **Shadow DOM**, and **HTML Templates**.

### [Custom Elements](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry)

This is the API that creates and manages custom HTML elements. Through \`.define()\` you register a new tag for the page.

You define the element with a [JavaScript class](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes):

\`\`\`js
class MyCustomElement extends HTMLElement {
  static observedAttributes = ["color", "size"];

  constructor() {
    // Always call super first in constructor
    super();
  }

  connectedCallback() {
    console.log("Custom element added to page.");
  }

  disconnectedCallback() {
    console.log("Custom element removed from page.");
  }

  adoptedCallback() {
    console.log("Custom element moved to new page.");
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(\`Attribute \${name} has changed.\`);
  }
}
\`\`\`

This shows the Web Component lifecycle and — more importantly — that you can extend any existing HTML element (\`<p>\` and \`<a>\` are components too!). The [MDN example](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements) extends \`HTMLElement\`, a blank canvas for building your element from scratch.

## [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)

Creating a new element can collide with tags, scripts, and CSS already on the page. **Shadow DOM** avoids that by *encapsulating* the element's structure inside a **shadow root** — like a nested HTML document.

**Any element can have a Shadow DOM.** You manipulate that tree without conflicting with the main document, because they're separate.

Creating one is straightforward. Interaction looks like regular DOM work, with the benefit of staying hidden until you attach it:

\`\`\`js
const host = document.querySelector("#host");
const shadow = host.attachShadow({ mode: "open" });
const span = document.createElement("span");
span.textContent = "I'm in the shadow DOM";
shadow.appendChild(span);
\`\`\`

That's a slice of the MDN example — follow the heading link for the full walkthrough.

## [HTML \`<template>\` and \`<slot>\`](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots)

If you come from Vue.js these tags will feel familiar. What I didn't know is that they're W3C recommendations!

\`<template>\` and \`<slot>\` accept markup but don't render it on page load. They also give you a JS-friendly way to clone structure (including *named slots*):

\`\`\`html
<template id="my-paragraph">
  <p>My paragraph</p>
</template>
\`\`\`

\`\`\`js
let template = document.getElementById("my-paragraph");
let templateContent = template.content;
document.body.appendChild(templateContent);
\`\`\`

## Demo

I built a [Web Component for ANS health-plan numbers](https://github.com/rhamses/ans-tag). Those numbers are mandatory on health sites and are often dumped in as images. As an HTML tag you can resize it just by changing \`font-size\`.

![](https://raw.githubusercontent.com/rhamses/ans-tag/main/demo/ans-demo.gif)

## References

- [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)
- [WebComponents.org](https://www.webcomponents.org)

## Frameworks that help day to day

- [Lit](https://lit.dev)
- [Polymer](https://polymer-library.polymer-project.org)
- [Stencil](https://stenciljs.com)
`,
	},

	"identificando-idiomas-atraves-do-javascript": {
		title: "Detecting languages with JavaScript",
		excerpt: "Using native features that help in day-to-day work.",
		content: `Working with multiple languages is the main doorway into Unicode — but not the only one, since emojis only exist thanks to that normalization. Identifying and working with Unicode sounds hard, but in JS it really isn't.

## Why Unicode

Without Unicode even HTML would fall apart — it's the base of encodings. That's why we have \`<meta charset="utf-8">\` to tell the browser how to render special characters.

https://www.youtube.com/watch?v=-n2nlPHEMG8

## Using Unicode in JavaScript

In JavaScript you use the \`\\u0000\` form, where the number is the code point. You can browse the [full Unicode charts](https://www.unicode.org/charts/) here.

\`\`\`js
const A = "\\u0100" // "Ā"
\`\`\`

## Identifying languages

Unicode symbols live in [contextual blocks](https://en.wikipedia.org/wiki/Unicode_block), which makes it easy to test text against block ranges. Caveat: blocks are contextual, not language-based — so you often need to test more than one block to decide which language a string belongs to.

In the example below, two different blocks map to "Korean" (Hangul and CJK). Japanese similarly needs at least Hiragana and Katakana.

\`\`\`js
/*
  See the gist at
  https://gist.github.com/rhamses/584861ba94b2fbe72f66078efe6df31e
*/

const ArabicBlock = new RegExp('[\\u0621-\\u064A]','g')
const ThaiBlock = new RegExp('[\\u0E00-\\u0E7F]','g')
const HangulBlock = new RegExp('[\\uAC00-\\uD7AF]','g')
const CJKBlock = new RegExp('[\\u3000-\\u303F]', 'g')
const HiraganaBlock = new RegExp('[\\u3040-\\u309F ]','g')
const KatanaBlock = new RegExp('[\\u30A0-\\u30FF ]','g')

function identifyLanguage(text) {
  let result
  if (text.match(ArabicBlock)) {
    result = ['ArabicBlock', text.match(ArabicBlock)];

  } else if (text.match(ThaiBlock)) {
    result = ['ThaiBlock', text.match(ThaiBlock)];

  } else if (text.match(HangulBlock)) {
    result = ['HangulBlock', text.match(HangulBlock)];

  } else if (text.match(KatanaBlock)) {
    result = ['KatanaBlock', text.match(KatanaBlock)];

  } else if (text.match(HiraganaBlock)) {
    result = ['HiraganaBlock', text.match(HiraganaBlock)];

  } else if (text.match(CJKBlock)) {
    result = ['CJKBlock', text.match(CJKBlock)];

  } else {
    result = "Unicode not found";
  }
  return result
}

// const text = "کمالہ_خان";
const text = "ยิ่งปัดยิ่งพุ่ง";
// const text = "끝없이서로의가능성을믿다";
// const text = "オリエント・アルカディア";

console.log(identifyLanguage(text))
\`\`\`

## Practical uses

One use is picking a font per script — it's hard to find a single free font that covers every language well.

On Google Fonts you can filter by language support. Below I compared Arabic text in **Roboto** versus **Almarai**, which covers Latin and Arabic — and became my choice for Arabic text in the Hashflags Bot project.

PLACEHOLDER_IMG_1

PLACEHOLDER_IMG_2

PLACEHOLDER_IMG_3

## Further reading

- [Unicode in JavaScript](https://flaviocopes.com/javascript-unicode/)
- [Official Unicode site](https://home.unicode.org/)
- [Unicode block](https://en.wikipedia.org/wiki/Unicode_block)
`,
	},

	"criando-imagens-dinamicamente-com-sharp-e-nodejs": {
		title: "Creating images dynamically with Sharp and Node.js",
		excerpt: "Building images from scratch with Sharp for Node.js",
		content: `[Sharp](https://www.npmjs.com/package/sharp) is one of the best-known packages in the Node.js ecosystem — the usual recommendation for image manipulation, conversion, and editing, and a dependency in many larger tools. What you hear less about is creating a brand-new image from scratch with Sharp. That's what this post covers.

PLACEHOLDER_IMG_1

## TL;DR

To build an image like the one below you stack several \`composite\` calls — like Photoshop layers — and use \`Buffer\` plus SVG helpers for text.

## Creating an image

We'll start from the official Sharp docs on [Compositing](https://sharp.pixelplumbing.com/api-composite).

To create a new image, instantiate Sharp with a \`create\` config and call \`.png()\` to say we're producing a PNG.

You get a buffer back that feeds the next steps.

\`\`\`js
// Parameters for the new instance
const sharpNewImage = {
  create: {
    width: 1200,
    height: 600,
    channels: 3,
    background: {
      r: 239,
      g: 246,
      b: 255,
    },
  },
};
// New instance — this holds a Buffer with the base image
const newImage = sharp(sharpNewImage).png();
\`\`\`

Inside \`create\` you'll use properties like:

### width

Image width in pixels (1200 in the example).

### height

Image height in pixels (600 in the example).

### channels

Color channels following RGBA (red, green, blue, alpha). The last channel can control overall transparency.

### background

A color object with numeric values (0–255) matching the selected channel count.

## Using composite

Once you have the base image, how do you add things on top? With \`composite\`. It merges layers and returns the result so you can keep going. Call it multiple times on the same instance to stack images and text.

\`\`\`js
// New layer with an image
newImage.composite({
  input: 'image.png',
  top: 200,
  left: 400,
});
\`\`\`

Those are some of the options; Sharp has more — read the [docs carefully](https://sharp.pixelplumbing.com/api-composite#parameters). Interesting ones include \`blend\`, \`animated\`, and \`raw\`.

### input

The image (or buffer) to place on the base. Sharp even accepts another Sharp instance, so you can chain transforms.

### top

Distance in pixels from the top of the base image.

### left

Distance in pixels from the left edge of the base image.

## Adding text

Here's the trick: Sharp supports \`jpeg\`, \`png\`, \`webp\`, \`gif\`, and \`svg\`, so you can draw text as SVG and composite it onto the base entirely in code.

There are many SVG text packages for Node. In this example I use [text-to-svg](https://www.npmjs.com/package/text-to-svg), which turns text into vectors for consistent results.

\`\`\`js
const TextToSVG = require('text-to-svg');
const textToSVG = TextToSVG.loadSync();

const attributes = {fill: 'red', stroke: 'black'};
const options = {x: 0, y: 0, fontSize: 72, anchor: 'top', attributes: attributes};

const svg = textToSVG.getSVG('Hello World', options);
\`\`\`

Then prepare the SVG for Sharp:

\`\`\`js
const svg = textToSVG.getSVG('Hello World', options);

// Turn SVG into a Buffer Sharp can read
const SvgText = Buffer.from(svg);

// New layer, this time with text
newImage.composite({
  input: SvgText,
  top: 300,
  left: 500,
});
\`\`\`

## Rendering the image

With a fully code-built image, it's time to export. Sharp offers a few outputs:

### .toBuffer

Export to a Node buffer for \`base64\` or further processing:

\`\`\`js
newImage.toBuffer((err, data, info) => {
  if (err) console.log(err);
  console.log("Image buffer", data)
  console.log("Image metadata", info)
});
\`\`\`

### .toFile

Write straight to disk with a valid absolute path. Use \`path\` and \`fs\` if you're saving outside the script directory:

\`\`\`js
newImage.toFile('path-to-image.png', (err) => {
  if (err) console.log(err);
});
\`\`\`

## Live demo

[Open the demo](https://codesandbox.io/embed/sharpjs-example-l755gs?fontsize=14&hidenavigation=1&theme=dark)
`,
	},
};

function extractPlaceholders(ptContent) {
	const images = [...ptContent.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => ({
		full: m[0],
		url: m[1],
		alt: (m[0].match(/!\[([^\]]*)\]/) || [, ""])[1],
	}));
	const videos = [...ptContent.matchAll(/\[Assistir vídeo\]\(([^)]+)\)/g)].map((m) => m[1]);
	return { images, videos };
}

function fillPlaceholders(enContent, ptContent) {
	const { images, videos } = extractPlaceholders(ptContent);
	let out = enContent;
	let imgIdx = 0;
	let vidIdx = 0;

	out = out.replace(/PLACEHOLDER_IMG_(\d+)/g, () => {
		const img = images[imgIdx++];
		if (!img) return "";
		const alt = img.alt || "Image";
		// Prefer English alt when placeholder had none meaningful
		return `![${alt}](${img.url})`;
	});

	out = out.replace(/PLACEHOLDER_VIDEO_(\d+)/g, () => {
		const url = videos[vidIdx++];
		if (!url) return "";
		return `[Watch video](${url})`;
	});

	return out;
}

async function main() {
	const client = new EmDashClient({ baseUrl: BASE, devBypass: true });
	const { items: existingEn } = await client.list("posts", {
		locale: "en",
		status: "published",
		limit: 50,
	});
	const enSlugs = new Set(existingEn.map((i) => i.slug));

	for (const [slug, translation] of Object.entries(EN)) {
		if (enSlugs.has(slug)) {
			console.log(`· skip ${slug} (already has EN)`);
			continue;
		}

		const pt = await client.get("posts", slug, { locale: "pt" });
		const content = fillPlaceholders(translation.content, pt.data.content);

		const data = {
			title: translation.title,
			excerpt: translation.excerpt,
			content,
		};
		if (pt.data.featured_image?.id) {
			data.featured_image = { id: pt.data.featured_image.id };
		}

		console.log(`→ translating ${slug}`);
		const created = await client.create("posts", {
			slug,
			locale: "en",
			translationOf: pt.id,
			publishedAt: pt.publishedAt,
			data,
		});
		await client.request("POST", `/content/posts/${created.id}/publish`, {
			publishedAt: pt.publishedAt,
		});

		// Copy taxonomies from PT via terms API if possible
		for (const tax of ["category", "tag"]) {
			try {
				const res = await client.request("GET", `/content/posts/${pt.id}/terms/${tax}`);
				const termIds = (res.terms || []).map((t) => t.id);
				if (termIds.length) {
					await client.request("POST", `/content/posts/${created.id}/terms/${tax}`, {
						termIds,
					});
				}
			} catch {
				/* ignore */
			}
		}

		console.log(`  ✓ ${created.id} @ ${pt.publishedAt}`);
	}

	const { items: en } = await client.list("posts", {
		locale: "en",
		status: "published",
		limit: 50,
	});
	console.log("\nEN posts now:", en.map((p) => p.slug).join(", "));
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
