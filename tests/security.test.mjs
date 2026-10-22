import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { GithubCardComponent } from "../src/plugins/rehype-component-github-card.mjs";
import { serializeForScript } from "../src/utils/script-data.mjs";

test("inline JSON preserves article data without allowing an HTML script escape", () => {
	const jsonLd = {
		"@type": "BlogPosting",
		headline: '</ScRiPt><script>alert("title")</script>',
		description: "<!-- </script><img src=x onerror=alert(1)> & 中文",
		keywords: ["ordinary", "<script>", "line\u2028separator\u2029"],
	};
	const serialized = serializeForScript(jsonLd);

	assert.doesNotMatch(serialized, /</);
	assert.deepEqual(JSON.parse(serialized), jsonLd);
	assert.equal(
		vm.runInNewContext(`JSON.stringify(${serialized})`),
		JSON.stringify(jsonLd),
	);
});

test("inline JSON accepts ordinary data and rejects non-JSON values", () => {
	assert.equal(
		serializeForScript({ title: "A normal post" }),
		'{"title":"A normal post"}',
	);
	assert.equal(serializeForScript(null), "null");
	assert.throws(() => serializeForScript(undefined), TypeError);
});

test("GitHub cards keep valid repository links and independent scripts", () => {
	const repositories = [
		"bbcslook-beep/my-website",
		"Owner-1/Repo_name.js",
		"a/.github",
	];
	const requests = [];
	const context = vm.createContext({
		fetch(url, options) {
			requests.push({ url, options });
			return new Promise(() => {});
		},
	});

	for (const repo of repositories) {
		const card = GithubCardComponent({ repo }, []);
		assert.equal(card.tagName, "a");
		assert.equal(card.properties.href, `https://github.com/${repo}`);
		const script = card.children.find((child) => child.tagName === "script");
		assert.ok(script, "Valid repositories must retain their loading script");
		const code = script.children.map((child) => child.value).join("");
		assert.doesNotMatch(code, /<\/script/i);
		vm.runInContext(code, context);
	}

	assert.deepEqual(
		requests.map((request) => request.url),
		repositories.map((repo) => `https://api.github.com/repos/${repo}`),
	);
	for (const { options } of requests) {
		assert.equal(options.referrerPolicy, "no-referrer");
	}
});

test("GitHub cards reject script injection and malformed repository names", () => {
	const invalidRepositories = [
		"owner/repo');alert(1);//",
		'owner/repo");alert(1);//',
		"owner/repo</script><script>alert(1)</script>",
		"owner/repo/extra",
		"owner/repo?query=1",
		"owner/repo#fragment",
		"owner/repo\n",
		" owner/repo",
		"-owner/repo",
		"owner-/repo",
		"owner/..",
		"owner/.",
		"/repo",
		"owner/",
		`${"a".repeat(40)}/repo`,
		`owner/${"a".repeat(101)}`,
		undefined,
		null,
		42,
		["owner/repo"],
	];

	for (const repo of invalidRepositories) {
		const card = GithubCardComponent({ repo }, []);
		assert.equal(card.tagName, "div", `Unexpected card for ${String(repo)}`);
		assert.ok(card.properties.className.includes("hidden"));
		assert.equal(
			card.children.some((child) => child.tagName === "script"),
			false,
		);
	}
});

test("the Markdown directive pipeline renders cards and rejects malicious repositories", async () => {
	const [
		{ createMarkdownProcessor },
		{ default: remarkDirective },
		{ default: rehypeComponents },
		{ parseDirectiveNode },
	] = await Promise.all([
		import("@astrojs/markdown-remark"),
		import("remark-directive"),
		import("rehype-components"),
		import("../src/plugins/remark-directive-rehype.js"),
	]);
	const processor = await createMarkdownProcessor({
		remarkPlugins: [remarkDirective, parseDirectiveNode],
		rehypePlugins: [
			[rehypeComponents, { components: { github: GithubCardComponent } }],
		],
		syntaxHighlight: false,
	});
	const { code: valid } = await processor.render(
		'::github{repo="bbcslook-beep/my-website"}',
	);
	assert.match(
		valid,
		/href="https:\/\/github\.com\/bbcslook-beep\/my-website"/,
	);
	assert.match(valid, /<script\b[^>]*>/);
	assert.match(valid, /const repo = "bbcslook-beep\/my-website"/);

	for (const repo of [
		"owner/repo');alert(1);//",
		"owner/repo</script><script>alert(1)</script>",
	]) {
		const { code: rejected } = await processor.render(
			`::github{repo="${repo}"}`,
		);
		assert.match(rejected, /Invalid repository/);
		assert.doesNotMatch(rejected, /<script\b/i);
		assert.doesNotMatch(rejected, /alert\(1\)/);
	}
});
