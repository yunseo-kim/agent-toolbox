#!/usr/bin/env bun

/**
 * Create a GPG-signed annotated git tag with a standardized message.
 *
 * When no custom description is provided, the tag body is auto-generated
 * from git-cliff (changelog since the previous tag). This makes
 * `git show v{version}` a self-contained release note.
 *
 * Usage:
 *   bun run tag                              # Tag current package.json version (auto-changelog)
 *   bun run tag v0.2.0                       # Tag explicit version (auto-changelog)
 *   bun run tag v0.2.0 "hotfix: auth timeout" # Tag with custom description (no changelog)
 *   bun run tag --push                       # Tag + push to remote
 *   bun run tag v0.2.0 --push                # Tag explicit version + push
 *
 * Default message template (with git-cliff):
 *   Release v{version}
 *
 *   ### Features
 *   - feat description
 *   ### Bug Fixes
 *   - fix description
 *
 * With custom description:
 *   Release v{version}
 *
 *   {description}
 */

import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

function run(cmd: string, opts?: { stdio?: "inherit" | "pipe" }): string {
  const result = execSync(cmd, {
    encoding: "utf8",
    stdio: opts?.stdio ?? "pipe",
  });
  return typeof result === "string" ? result.trim() : "";
}

function getPackageVersion(): string {
  const pkg = JSON.parse(run("cat package.json"));
  return pkg.version as string;
}

function tagExists(tag: string): boolean {
  try {
    run(`git rev-parse ${tag}`);
    return true;
  } catch {
    return false;
  }
}

// ─── Parse args ───────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const pushFlag = args.includes("--push");
const positional = args.filter((a) => !a.startsWith("--"));

const versionArg = positional[0];
const descriptionArg = positional[1];

// Resolve version: explicit arg or package.json
const version = versionArg
  ? versionArg.replace(/^v/, "")
  : getPackageVersion();

const tag = `v${version}`;

// Build tag message
const lines = [`Release ${tag}`];
if (descriptionArg) {
  lines.push("", descriptionArg);
} else {
  // Auto-generate changelog body from git-cliff
  try {
    const changelog = run(`git cliff --tag ${tag} --unreleased --strip all`);
    if (changelog) {
      lines.push("", changelog);
    }
  } catch {
    // git-cliff not available or no unreleased commits — proceed without body
  }
}
const message = lines.join("\n");

// ─── Validate ─────────────────────────────────────────────────────────────

if (!/^\d+\.\d+\.\d+/.test(version)) {
  console.error(`Invalid version: "${version}". Expected semver (e.g. 0.2.0)`);
  process.exit(1);
}

if (tagExists(tag)) {
  console.error(`Tag ${tag} already exists. Delete it first: git tag -d ${tag}`);
  process.exit(1);
}

// ─── Create signed annotated tag ──────────────────────────────────────────

const msgFile = join(tmpdir(), `tag-msg-${tag}.txt`);
await Bun.write(msgFile, message);

execSync(`git tag -s ${tag} -F "${msgFile}"`, { stdio: "inherit" });

console.log(`Created signed tag: ${tag}`);

// Verify
const tagType = run(`git cat-file -t ${tag}`);
if (tagType !== "tag") {
  console.error(`Unexpected tag type: ${tagType} (expected "tag")`);
  process.exit(1);
}

// ─── Push (optional) ──────────────────────────────────────────────────────

if (pushFlag) {
  execSync(`git push origin ${tag}`, { stdio: "inherit" });
  console.log(`Pushed ${tag} to remote`);
}
