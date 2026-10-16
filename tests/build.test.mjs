import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = new URL("../dist/", import.meta.url);
const read = (file) => readFileSync(new URL(file, root), "utf8");
const publishedRoutes = JSON.parse(
	readFileSync(
		new URL("./fixtures/published-routes.json", import.meta.url),
		"utf8",
	),
);

test("the Markdown pipeline renders inline and display formulas with updated KaTeX", async () => {
	const [
		{ createMarkdownProcessor },
		{ default: remarkMath },
		{ default: rehypeKatex },
	] = await Promise.all([
		import("@astrojs/markdown-remark"),
		import("remark-math"),
		import("rehype-katex"),
	]);
	const processor = await createMarkdownProcessor({
		remarkPlugins: [remarkMath],
		rehypePlugins: [rehypeKatex],
		syntaxHighlight: false,
	});
	const { code } = await processor.render(
		"Inline $a^2 + b^2 = c^2$.\n\n$$\n\\frac{1}{2} + \\sqrt{x}\n$$",
	);
	assert.match(code, /class="katex"/);
	assert.match(code, /class="katex-display"/);
	assert.doesNotMatch(code, /katex-error/);
});

test("all URLs published before the Astro migration remain available", () => {
	for (const route of publishedRoutes) {
		const html = read(route.slice(1));
		assert.match(html, /<html\b/, route);
		assert.match(html, /<title>[^<]+<\/title>/, route);
		if (route.startsWith("/posts/")) {
			assert.match(html, /data-pagefind-body/, route);
			assert.match(html, /class="[^"]*custom-md/, route);
		}
	}
});

test("RSS links still point to published article pages", () => {
	const rss = read("rss.xml");
	const items = [...rss.matchAll(/<item>([\s\S]*?)<\/item>/g)];
	assert.ok(items.length > 0, "RSS must contain articles");
	for (const [, item] of items) {
		const link = item.match(/<link>(.*?)<\/link>/)?.[1];
		assert.ok(link, "Each article must have an RSS link");
		const url = new URL(link);
		assert.equal(url.origin, "https://bbcslook.top");
		assert.ok(url.pathname.startsWith("/posts/"));
		assert.ok(
			existsSync(new URL(`${url.pathname.slice(1)}index.html`, root)),
			link,
		);
	}
});

test("Pagefind includes every page marked for indexing", () => {
	const entry = JSON.parse(read("pagefind/pagefind-entry.json"));
	const indexedPages = Object.values(entry.languages).reduce(
		(total, language) => total + language.page_count,
		0,
	);
	const indexablePages = readdirSync(root, { recursive: true })
		.filter((file) => file.endsWith(".html"))
		.filter((file) =>
			/data-pagefind-body/.test(read(file.replaceAll(path.sep, "/"))),
		);
	assert.ok(indexablePages.length > 0);
	assert.equal(indexedPages, indexablePages.length);
	assert.ok(existsSync(new URL("pagefind/pagefind.js", root)));
});

test("local built scripts, styles and images resolve on disk", () => {
	for (const route of publishedRoutes) {
		const html = read(route.slice(1));
		for (const [, asset] of html.matchAll(
			/(?:src|href)="(\/_astro\/[^"?#]+)(?:[?#][^"]*)?"/g,
		)) {
			assert.ok(
				existsSync(new URL(asset.slice(1), root)),
				`${route}: ${asset}`,
			);
		}
	}
	assert.ok(
		readdirSync(new URL("_astro/", root)).some(
			(file) => path.extname(file) === ".css",
		),
	);
});
