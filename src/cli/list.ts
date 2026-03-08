import { join } from "node:path";
import { resolveCatalogDir } from "../catalog/provider.js";
import { scanSkills } from "../catalog/scanner.js";
import { filterSkills } from "../install/filter.js";
import { readManifest } from "../install/manifest.js";
import { TargetTool } from "../schemas/common.js";
import {
  bold,
  cyan,
  dim,
  formatTable,
  parseArgs,
  red,
  resolveRootDir,
  yellow,
} from "./utils.js";

const NAME = "agent-toolbox";

function printListHelp(): void {
  console.log(
    `
USAGE
  ${NAME} list [options]

DESCRIPTION
  List skills in the agent-toolbox catalog. By default lists all catalog skills.
  Use --installed --target <tool> to list skills installed for a specific target.

OPTIONS
  --domain <d>       Filter by domain
  --subdomain <s>    Filter by subdomain
  --framework <fw>   Filter by framework
  --tag <tag>        Filter by tag
  --provenance <p>   Filter by provenance (ported|adapted|synthesized|original)
  --installed        List installed skills (requires --target)
  --target <tool>    Target tool for --installed mode
  --json             Output as JSON
  --count            Show count only
  --refresh          Force re-download catalog from remote
  --offline          Use cached catalog only

EXAMPLES
  ${NAME} list
  ${NAME} list --domain devops
  ${NAME} list --provenance ported --count
  ${NAME} list --installed --target claude-code
  ${NAME} list --json
`.trimStart(),
  );
}

export async function runList(rootDir: string, argv: string[]): Promise<void> {
  const args = parseArgs(argv);

  if (args.help === "true" || args.h === "true") {
    printListHelp();
    process.exit(0);
  }

  const isInstalled = args.installed === "true";

  // Installed mode: read manifest
  if (isInstalled) {
    if (!args.target || args.target === "true") {
      console.error(`${red("Error:")} --installed requires --target <tool>`);
      process.exit(1);
    }
    const targetParse = TargetTool.safeParse(args.target);
    if (!targetParse.success) {
      console.error(
        `${red("Error:")} Invalid target: ${String(args.target)}. Valid: claude-code, opencode, cursor, codex, gemini`,
      );
      process.exit(1);
    }

    const targetDir = join(rootDir, "dist", "targets", targetParse.data);
    const manifest = await readManifest(targetDir);
    if (!manifest) {
      console.log(
        `No skills installed for ${bold(targetParse.data)}. Run '${NAME} install --target ${targetParse.data}' first.`,
      );
      process.exit(0);
    }

    if (args.count === "true") {
      console.log(manifest.skills.length);
      process.exit(0);
    }

    if (args.json === "true") {
      console.log(JSON.stringify(manifest.skills, null, 2));
      process.exit(0);
    }

    console.log(
      `\n${bold("Installed skills")} for ${cyan(targetParse.data)} ${dim(`(${manifest.installedAt})`)}`,
    );
    console.log();

    const headers = ["Name", "Domain", "Subdomain", "Last Updated"];
    const rows = manifest.skills.map((s) => [
      s.name,
      s.domain,
      s.subdomain ?? "",
      s.lastUpdated,
    ]);
    console.log(formatTable(headers, rows));
    console.log(`\n${dim(`Total: ${manifest.skills.length} skills`)}`);
    return;
  }

  // Catalog mode: scan and filter
  const catalogDir = await resolveCatalogDir({
    rootDir,
    refresh: args.refresh === "true",
    offline: args.offline === "true",
  });

  const { skills, errors } = await scanSkills(catalogDir);
  if (errors.length > 0) {
    for (const err of errors) {
      console.error(`${yellow("Warning:")} ${err.path}: ${err.error}`);
    }
  }

  // Apply standard filters
  const filterResult = filterSkills(skills, {
    target: "claude-code", // required by schema but unused for listing
    domain:
      typeof args.domain === "string" && args.domain !== "true"
        ? args.domain
        : undefined,
    subdomain:
      typeof args.subdomain === "string" && args.subdomain !== "true"
        ? args.subdomain
        : undefined,
    framework:
      typeof args.framework === "string" && args.framework !== "true"
        ? args.framework
        : undefined,
    tag:
      typeof args.tag === "string" && args.tag !== "true"
        ? args.tag
        : undefined,
  });

  // Additional provenance filter (list-specific)
  let matched = filterResult.matched;
  if (typeof args.provenance === "string" && args.provenance !== "true") {
    const prov = args.provenance.toLowerCase();
    matched = matched.filter((s) => s.frontmatter.metadata.provenance === prov);
  }

  // Sort by name
  matched.sort((a, b) => a.frontmatter.name.localeCompare(b.frontmatter.name));

  if (args.count === "true") {
    console.log(matched.length);
    process.exit(0);
  }

  if (args.json === "true") {
    const entries = matched.map((s) => ({
      name: s.frontmatter.name,
      description: s.frontmatter.description,
      domain: s.frontmatter.metadata.domain,
      subdomain: s.frontmatter.metadata.subdomain ?? null,
      provenance: s.frontmatter.metadata.provenance,
      author: s.frontmatter.metadata.author,
      lastUpdated: s.frontmatter.metadata.lastUpdated,
    }));
    console.log(JSON.stringify(entries, null, 2));
    process.exit(0);
  }

  // Table output
  const appliedFilters = [...filterResult.appliedFilters];
  if (typeof args.provenance === "string" && args.provenance !== "true") {
    appliedFilters.push(`provenance=${args.provenance}`);
  }

  if (appliedFilters.length > 0) {
    console.log(`${dim("Filters:")} ${appliedFilters.join(", ")}`);
  }

  console.log(
    `\n${bold("Catalog Skills")} ${dim(`(${matched.length}/${filterResult.total})`)}`,
  );
  console.log();

  const headers = ["Name", "Domain", "Provenance", "Description"];
  const rows = matched.map((s) => [
    s.frontmatter.name,
    s.frontmatter.metadata.domain,
    s.frontmatter.metadata.provenance,
    s.frontmatter.description,
  ]);
  console.log(formatTable(headers, rows, { maxColWidth: 50 }));

  // Domain summary
  const domainCounts = new Map<string, number>();
  for (const s of matched) {
    const d = s.frontmatter.metadata.domain;
    domainCounts.set(d, (domainCounts.get(d) ?? 0) + 1);
  }
  const domainSummary = [...domainCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([d, c]) => `${d} ${dim(`(${c})`)}`)
    .join("  ");
  console.log(`\n${dim("Domains:")} ${domainSummary}`);
  console.log(`${dim("Total:")} ${cyan(String(matched.length))} skills`);
}

if (import.meta.main) {
  const rootDir = resolveRootDir(import.meta.dir);
  runList(rootDir, process.argv.slice(2)).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${red("Error:")} ${message}`);
    process.exit(1);
  });
}
