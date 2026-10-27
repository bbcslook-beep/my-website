import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const component = readFileSync(
	new URL("../src/components/WallpaperViewer.astro", import.meta.url),
	"utf8",
);
const script = component.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, "The wallpaper component must contain its client script");
const { outputText } = ts.transpileModule(script, {
	compilerOptions: { target: ts.ScriptTarget.ES2022 },
});

function deferred() {
	let resolve;
	let reject;
	const promise = new Promise((accept, fail) => {
		resolve = accept;
		reject = fail;
	});
	return { promise, resolve, reject };
}

function createViewer({ reducedMotion = false } = {}) {
	const requests = [];
	const animations = [];
	const hooks = new Map();
	const location = { pathname: "/", search: "", hash: "" };
	class Element {
		constructor() {
			const classes = new Set();
			this.classList = {
				add: (name) => classes.add(name),
				contains: (name) => classes.has(name),
				toggle(name, enabled = !classes.has(name)) {
					if (enabled) classes.add(name);
					else classes.delete(name);
				},
			};
			this.dataset = {};
			this.style = {};
			this.children = [];
			this.listeners = new Map();
			this.parentElement = null;
		}
		get isConnected() {
			return this.parentElement !== null;
		}
		addEventListener(name, callback) {
			const listeners = this.listeners.get(name) ?? [];
			listeners.push(callback);
			this.listeners.set(name, listeners);
		}
		append(child) {
			child.remove();
			child.parentElement = this;
			this.children.push(child);
		}
		remove() {
			const siblings = this.parentElement?.children;
			if (siblings) siblings.splice(siblings.indexOf(this), 1);
			this.parentElement = null;
		}
		focus() {}
	}
	class Image extends Element {
		constructor() {
			super();
			this.decoded = deferred();
			requests.push(this);
		}
		decode() {
			return this.decoded.promise;
		}
		animate(keyframes, options) {
			const completion = deferred();
			const animation = {
				target: this,
				keyframes,
				options,
				finished: completion.promise,
				finish: completion.resolve,
			};
			animations.push(animation);
			if (options.duration === 0) completion.resolve();
			return animation;
		}
	}
	const elements = {
		"wallpaper-ui": new Element(),
		"my-custom-bg": new Element(),
		"wallpaper-exit": new Element(),
	};
	const document = Object.assign(new Element(), {
		body: new Element(),
		activeElement: null,
		getElementById: (id) => elements[id],
	});
	const swup = {
		hooks: {
			on(name, callback) {
				const callbacks = hooks.get(name) ?? [];
				callbacks.push(callback);
				hooks.set(name, callbacks);
			},
		},
	};
	const context = vm.createContext({
		document,
		location,
		Image,
		Element,
		HTMLElement: Element,
		window: { swup, matchMedia: () => ({ matches: reducedMotion }) },
	});
	const emit = (name) => hooks.get(name)?.forEach((callback) => callback());
	return {
		requests,
		animations,
		hooks,
		document,
		elements,
		background: elements["my-custom-bg"],
		// Each execution gets a new scope, just like copied production module scripts.
		execute: () => vm.runInContext(`(() => { ${outputText}\n })()`, context),
		navigate(pathname, search = "") {
			emit("visit:start");
			Object.assign(location, { pathname, search });
			emit("page:view");
		},
	};
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

async function showFirstImage(viewer) {
	viewer.execute();
	viewer.requests[0].decoded.resolve();
	await settle();
	viewer.animations[0].finish();
	await settle();
	return viewer.requests[0];
}

test("production script re-execution preserves one background owner and navigation listeners", () => {
	const viewer = createViewer();
	viewer.execute();
	viewer.execute();
	viewer.execute();
	assert.equal(viewer.requests.length, 1);
	assert.equal(viewer.document.listeners.get("dblclick").length, 1);
	assert.equal(viewer.document.listeners.get("keydown").length, 1);
	assert.equal(
		viewer.elements["wallpaper-exit"].listeners.get("click").length,
		1,
	);
	assert.equal(viewer.hooks.get("page:view").length, 1);
	assert.equal(viewer.hooks.get("visit:start").length, 1);
	viewer.navigate("/");
	assert.equal(
		viewer.requests.length,
		1,
		"The initial page:view must not request a second image",
	);
	viewer.navigate("/about/");
	viewer.execute();
	assert.equal(
		viewer.requests.length,
		2,
		"A new page requests exactly one new wallpaper",
	);
	viewer.navigate("/about/");
	assert.equal(
		viewer.requests.length,
		2,
		"Repeated page:view must not replace the same page again",
	);
	viewer.navigate("/about/", "?category=notes");
	assert.equal(viewer.requests.length, 3);
});

test("a new wallpaper fades over the connected old image until its animation finishes", async () => {
	const viewer = createViewer();
	const oldImage = await showFirstImage(viewer);
	viewer.navigate("/friends/");
	assert.deepEqual(
		viewer.background.children,
		[oldImage],
		"Loading must preserve the old image",
	);
	const newImage = viewer.requests[1];
	newImage.decoded.resolve();
	await settle();
	assert.deepEqual(viewer.background.children, [oldImage, newImage]);
	assert.equal(oldImage.isConnected, true);
	assert.notEqual(oldImage.style.opacity, "0");
	assert.equal(
		viewer.animations.filter((animation) => animation.target === oldImage)
			.length,
		1,
		"The outgoing image must not receive another fade-out animation",
	);
	const incoming = viewer.animations[1];
	assert.equal(incoming.target, newImage);
	assert.deepEqual(
		Array.from(incoming.keyframes, (frame) => frame.opacity),
		[0, 1],
	);
	incoming.finish();
	await settle();
	assert.equal(oldImage.isConnected, false);
	assert.deepEqual(viewer.background.children, [newImage]);
});

test("a failed replacement leaves the visible wallpaper intact", async () => {
	const viewer = createViewer();
	const oldImage = await showFirstImage(viewer);
	viewer.navigate("/archive/");
	viewer.requests[1].decoded.reject(new Error("Image unavailable"));
	await settle();
	assert.deepEqual(viewer.background.children, [oldImage]);
	assert.equal(viewer.animations.length, 1);
	assert.equal(viewer.background.classList.contains("loaded"), true);
});

test("rapid navigation finishes the active crossfade before showing only the newest decoded image", async () => {
	const viewer = createViewer();
	const original = await showFirstImage(viewer);
	viewer.navigate("/about/");
	const incoming = viewer.requests[1];
	incoming.decoded.resolve();
	await settle();
	viewer.navigate("/archive/");
	const obsolete = viewer.requests[2];
	viewer.navigate("/friends/");
	const newest = viewer.requests[3];
	newest.decoded.resolve();
	obsolete.decoded.resolve();
	await settle();
	assert.equal(
		viewer.animations.length,
		2,
		"The active transition must finish first",
	);
	assert.deepEqual(viewer.background.children, [original, incoming]);
	viewer.animations[1].finish();
	await settle();
	assert.equal(viewer.animations.length, 3);
	assert.equal(viewer.animations[2].target, newest);
	assert.deepEqual(viewer.background.children, [incoming, newest]);
	assert.equal(obsolete.isConnected, false);
	viewer.animations[2].finish();
	await settle();
	assert.deepEqual(viewer.background.children, [newest]);
});

test("reduced motion replaces decoded images without waiting for a visible animation", async () => {
	const viewer = createViewer({ reducedMotion: true });
	viewer.execute();
	viewer.requests[0].decoded.resolve();
	await settle();
	const oldImage = viewer.requests[0];
	viewer.navigate("/friends/");
	const newImage = viewer.requests[1];
	newImage.decoded.resolve();
	await settle();
	assert.ok(
		viewer.animations.every((animation) => animation.options.duration === 0),
	);
	assert.equal(oldImage.isConnected, false);
	assert.deepEqual(viewer.background.children, [newImage]);
});
