import { resolveCatalogDir } from "../catalog/provider.js";
import { scanSkills } from "../catalog/scanner.js";
import { searchSkills } from "../catalog/search.js";
import { filterSkills } from "../install/filter.js";
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
const DEFAULT_LIMIT = 20;

function printFindHelp(): void {
  console.log(
    `
USAGE
  ${NAME} find <query> [options]

DESCRIPTION
  Search catalog skills by keyword. Matches against name, description,
  domain, subdomain, tags, and frameworks with weighted scoring.

OPTIONS
  --domain <d>       Pre-filter by domain before searching
  --limit <n>        Max results (default: ${DEFAULT_LIMIT})
  --json             Output as JSON
  --refresh          Force re-download catalog from remote
  --offline          Use cached catalog only

EXAMPLES
  ${NAME} find git
  ${NAME} find react --domain development
  ${NAME} find "ci-cd" --json
  ${NAME} find testing --limit 5
`.trimStart(),
  );
}

export async function runFind(rootDir: string, argv: string[]): Promise<void> {
  const args = parseArgs(argv);

  if (args.help === "true" || args.h === "true") {
    printFindHelp();
    process.exit(0);
  }

  // Extract positional query (first non-flag argument)
  const query = argv.find(
    (arg, idx) =>
      !arg.startsWith("--") && (idx === 0 || !argv[idx - 1]?.startsWith("--")),
  );

  if (!query) {
    console.error(`${red("Error:")} Missing search query.`);
    console.error(`Usage: ${NAME} find <query> [options]`);
    process.exit(1);
  }

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

  // Pre-filter by domain if specified
  let searchPool = skills;
  if (typeof args.domain === "string" && args.domain !== "true") {
    const result = filterSkills(skills, {
      target: "claude-code",
      domain: args.domain,
    });
    searchPool = result.matched;
  }

  // Search
  const results = searchSkills(searchPool, query);

  // Apply limit
  const limitStr = typeof args.limit === "string" ? args.limit : undefined;
  const limit = limitStr ? parseInt(limitStr, 10) : DEFAULT_LIMIT;
  const limited = results.slice(0, limit);

  if (args.json === "true") {
    const entries = limited.map((r) => ({
      name: r.skill.frontmatter.name,
      description: r.skill.frontmatter.description,
      domain: r.skill.frontmatter.metadata.domain,
      subdomain: r.skill.frontmatter.metadata.subdomain ?? null,
      score: r.score,
      matchedFields: r.matchedFields,
    }));
    console.log(JSON.stringify(entries, null, 2));
    process.exit(0);
  }

  if (results.length === 0) {
    console.log(`No skills found matching ${bold(`"${query}"`)}.`);
    process.exit(0);
  }

  const domainNote =
    typeof args.domain === "string" && args.domain !== "true"
      ? ` in ${cyan(args.domain)}`
      : "";
  console.log(
    `\n${bold("Search results")} for ${cyan(`"${query}"`)}${domainNote} ${dim(`(${results.length} found, showing ${limited.length})`)}`,
  );
  console.log();

  const headers = ["Name", "Domain", "Score", "Matched", "Description"];
  const rows = limited.map((r) => [
    r.skill.frontmatter.name,
    r.skill.frontmatter.metadata.domain,
    String(r.score),
    r.matchedFields.join(", "),
    r.skill.frontmatter.description,
  ]);
  console.log(formatTable(headers, rows, { maxColWidth: 45 }));

  if (results.length > limit) {
    console.log(
      `\n${dim(`Showing ${limit} of ${results.length} results. Use --limit to see more.`)}`,
    );
  }
}

if (import.meta.main) {
  const rootDir = resolveRootDir(import.meta.dir);
  runFind(rootDir, process.argv.slice(2)).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${red("Error:")} ${message}`);
    process.exit(1);
  });
}
