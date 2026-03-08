import { parse as parseYaml } from "yaml";
import { TaxonomySchema, type Taxonomy } from "../schemas/taxonomy.js";

export async function loadTaxonomy(taxonomyPath: string): Promise<Taxonomy> {
  let content: string;

  try {
    content = await Bun.file(taxonomyPath).text();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to read taxonomy file '${taxonomyPath}': ${reason}`,
    );
  }

  let rawTaxonomy: unknown;

  try {
    rawTaxonomy = parseYaml(content);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Malformed taxonomy YAML at '${taxonomyPath}': ${reason}`);
  }

  try {
    return TaxonomySchema.parse(rawTaxonomy);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid taxonomy schema at '${taxonomyPath}': ${reason}`);
  }
}

export function validateDomain(taxonomy: Taxonomy, domain: string): boolean {
  return Object.hasOwn(taxonomy.domains, domain);
}

export function validateSubdomain(
  taxonomy: Taxonomy,
  domain: string,
  subdomain: string,
): boolean {
  const domainEntry = taxonomy.domains[domain];

  if (!domainEntry) {
    return false;
  }

  return domainEntry.subdomains.includes(subdomain);
}

export function getValidDomains(taxonomy: Taxonomy): string[] {
  return Object.keys(taxonomy.domains).sort((a, b) => a.localeCompare(b));
}

export function getValidSubdomains(
  taxonomy: Taxonomy,
  domain: string,
): string[] {
  const domainEntry = taxonomy.domains[domain];

  if (!domainEntry) {
    return [];
  }

  return [...domainEntry.subdomains].sort((a, b) => a.localeCompare(b));
}
