#!/usr/bin/env bun

/**
 * PR-based release pipeline (compatible with branch protection):
 *   1. Ensure we're on main, up-to-date
 *   2. Create release branch from main
 *   3. bumpp — interactive version bump + changelog + commit (no tag, no push)
 *   4. Rename branch to release/v{version}
 *   5. Push branch and create PR
 *
 * After the PR is merged:
 *   git checkout main && git pull
 *   bun run tag --push
 *
 * Usage:
 *   bun run release          # Interactive (bumpp prompts for version)
 *   bun run release --dry    # Dry run — stop after bumpp, no branch or PR
 */

import { execSync } from "node:child_process";

function run(cmd: string, opts?: { stdio?: "inherit" | "pipe" }): string {
  const result = execSync(cmd, {
    encoding: "utf8",
    stdio: opts?.stdio ?? "inherit",
  });
  return typeof result === "string" ? result.trim() : "";
}

const isDry = process.argv.includes("--dry");

// ─── Step 1: Ensure clean main ────────────────────────────────────────

const currentBranch = run("git branch --show-current", { stdio: "pipe" });
if (currentBranch !== "main") {
  console.error(`Must be on main branch (currently on ${currentBranch}).`);
  process.exit(1);
}

run("git pull --ff-only");

// ─── Step 2: Create temporary release branch ──────────────────────────

run("git checkout -b release/prep");

// ─── Step 3: bumpp (version bump + changelog + commit) ────────────────

console.log("Running bumpp...\n");
run("bunx bumpp");

// Read the version bumpp wrote to package.json
const pkg = JSON.parse(run("cat package.json", { stdio: "pipe" }));
const version: string = pkg.version;
const tag = `v${version}`;
const branch = `release/${tag}`;

console.log(`\nVersion: ${version}`);

if (isDry) {
  console.log(`[DRY RUN] Would create branch ${branch} and open PR.`);
  run("git checkout main");
  run("git branch -D release/prep");
  process.exit(0);
}

// ─── Step 4: Rename branch ────────────────────────────────────────────

run(`git branch -m ${branch}`);

// ─── Step 5: Push branch and create PR ────────────────────────────────

run(`git push -u origin ${branch}`);

const prTitle = `chore(release): ${tag}`;
const prBody = `## Release ${tag}

Version bump, changelog update, and release preparation.

### After merge
\`\`\`bash
git checkout main && git pull
bun run tag --push
\`\`\``;

run(`gh pr create --title "${prTitle}" --body ${JSON.stringify(prBody)} --base main`);

console.log(`\n── Release PR created for ${tag} ──`);
console.log(`After the PR is merged and CI passes:`);
console.log(`  git checkout main && git pull`);
console.log(`  bun run tag --push`);
