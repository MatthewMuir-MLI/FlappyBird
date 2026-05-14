#!/usr/bin/env node
// Generate a sprite via the OpenAI Images API (gpt-image-1).
//
// Usage:
//   node scripts/generate-sprite.mjs --asset bird --version v1 --count 3
//   node scripts/generate-sprite.mjs --asset bird --version v1 --count 1 --quality low --suffix probe
//   node scripts/generate-sprite.mjs --asset pipe --version v1 --count 3 --ref public/assets/bird.png
//
// Reads three prompt files and composes them into the model prompt:
//   scripts/prompts/house-style.txt   (prepended to every prompt)
//   scripts/prompts/<asset>-<version>.txt   (the subject-specific phrase)
//   scripts/prompts/negatives.txt     (appended to every prompt)
//
// With --ref, switches to /v1/images/edits and passes the reference PNG
// as image[] (style/composition reference, not a mask). This is how
// assets after the bird stay visually cohesive with it.
//
// Output: public/assets/<asset>-<version>-<a|b|c|...>.png
// (or, with --suffix probe, public/assets/<asset>-<version>-probe.png).
//
// Requires $OPENAI_API_KEY in the environment. Does not write the key
// to any file. Does not depend on any SDK or on `sharp`. Native alpha
// from `background: "transparent"` is the only background handling.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Buffer } from "node:buffer";

const args = parseArgs(process.argv.slice(2));
const asset = required(args, "asset");
const version = required(args, "version");
const count = Number(args.count ?? 3);
const quality = args.quality ?? "medium"; // low | medium | high
const size = args.size ?? "1024x1024";
const ref = args.ref ?? null;
const suffix = args.suffix ?? null; // overrides letter labels (a/b/c) when set

if (!process.env.OPENAI_API_KEY) {
	console.error("OPENAI_API_KEY is not set in the environment.");
	process.exit(1);
}
if (!Number.isInteger(count) || count < 1 || count > 10) {
	console.error(`--count must be an integer 1..10 (got ${args.count}).`);
	process.exit(1);
}
if (!["low", "medium", "high"].includes(quality)) {
	console.error(`--quality must be one of: low, medium, high (got ${quality}).`);
	process.exit(1);
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const promptsDir = resolve(repoRoot, "scripts/prompts");
const outDir = resolve(repoRoot, "public/assets");

const housePath = resolve(promptsDir, "house-style.txt");
const subjectPath = resolve(promptsDir, `${asset}-${version}.txt`);
const negativesPath = resolve(promptsDir, "negatives.txt");

const [house, subject, negatives] = await Promise.all([
	readFile(housePath, "utf8"),
	readFile(subjectPath, "utf8"),
	readFile(negativesPath, "utf8"),
]);

const corePrompt = `${house.trim()} ${subject.trim()} ${negatives.trim()}`;
const finalPrompt = ref
	? `Match the visual style of the reference image exactly: same linework weight, same paper grain, same palette, same level of stylization. ${corePrompt}`
	: corePrompt;

await mkdir(outDir, { recursive: true });

console.log(
	`generate-sprite: asset=${asset} version=${version} count=${count} quality=${quality} size=${size} ref=${ref ?? "(none)"}`,
);
console.log(`prompt length: ${finalPrompt.length} chars`);

const letters = "abcdefghij";
for (let i = 0; i < count; i++) {
	const label = suffix ?? letters[i];
	const outPath = resolve(outDir, `${asset}-${version}-${label}.png`);
	console.log(`[${i + 1}/${count}] requesting -> ${outPath}`);
	const b64 = ref
		? await callEdits({ prompt: finalPrompt, refPath: resolve(repoRoot, ref), size, quality })
		: await callGenerations({ prompt: finalPrompt, size, quality });
	await writeFile(outPath, Buffer.from(b64, "base64"));
	console.log(`        saved (${(Buffer.from(b64, "base64").byteLength / 1024).toFixed(1)} KB)`);
}

console.log("done.");

async function callGenerations({ prompt, size, quality }) {
	const body = {
		model: "gpt-image-1",
		prompt,
		size,
		quality,
		background: "transparent",
		output_format: "png",
		n: 1,
	};
	const res = await fetch("https://api.openai.com/v1/images/generations", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`OpenAI generations ${res.status}: ${text}`);
	}
	const json = await res.json();
	const b64 = json?.data?.[0]?.b64_json;
	if (!b64) throw new Error(`No b64_json in response: ${JSON.stringify(json).slice(0, 400)}`);
	return b64;
}

async function callEdits({ prompt, refPath, size, quality }) {
	const refBytes = await readFile(refPath);
	const form = new FormData();
	form.append("model", "gpt-image-1");
	form.append("prompt", prompt);
	form.append("size", size);
	form.append("quality", quality);
	form.append("background", "transparent");
	form.append("output_format", "png");
	form.append("n", "1");
	form.append("image[]", new Blob([refBytes], { type: "image/png" }), "reference.png");
	const res = await fetch("https://api.openai.com/v1/images/edits", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
		},
		body: form,
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`OpenAI edits ${res.status}: ${text}`);
	}
	const json = await res.json();
	const b64 = json?.data?.[0]?.b64_json;
	if (!b64) throw new Error(`No b64_json in response: ${JSON.stringify(json).slice(0, 400)}`);
	return b64;
}

function parseArgs(argv) {
	const out = {};
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a.startsWith("--")) {
			const key = a.slice(2);
			const next = argv[i + 1];
			if (next !== undefined && !next.startsWith("--")) {
				out[key] = next;
				i++;
			} else {
				out[key] = true;
			}
		}
	}
	return out;
}

function required(obj, key) {
	if (obj[key] === undefined) {
		console.error(`Missing required arg: --${key}`);
		process.exit(1);
	}
	return obj[key];
}
