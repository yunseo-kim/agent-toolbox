import { readdir } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { scanSkills } from "./scanner.js";
import { loadTaxonomy, validateDomain, validateSubdomain } from "./taxonomy.js";

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats: ValidationStats;
}

export interface ValidationError {
  path: string;
  field?: string;
  message: string;
}

export interface ValidationWarning {
  path: string;
  field?: string;
  message: string;
}

export interface ValidationStats {
  totalSkills: number;
  validSkills: number;
  invalidSkills: number;
  domains: Record<string, number>;
}

const HOLOCENE_DATE_REGEX =
  /^1\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;
const VALID_PROVENANCE = new Set([
  "ported",
  "adapted",
  "synthesized",
  "original",
]);

function skillKeyFromPath(path: string): string {
  if (path.endsWith("SKILL.md")) {
    return basename(dirname(path));
  }

  return basename(path);
}

export async function validateCatalog(
  catalogDir: string,
  taxonomyPath: string,
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const invalidSkillKeys = new Set<string>();
  const domainCounts: Record<string, number> = {};

  const taxonomy = await loadTaxonomy(taxonomyPath);
  const scanResult = await scanSkills(catalogDir);

  for (const scanError of scanResult.errors) {
    errors.push({
      path: scanError.path,
      message: scanError.error,
    });
    invalidSkillKeys.add(skillKeyFromPath(scanError.path));
  }

  for (const skill of scanResult.skills) {
    const skillPath = join(catalogDir, "skills", skill.dirName);
    const metadata = skill.frontmatter.metadata;
    const description = skill.frontmatter.description;

    domainCounts[metadata.domain] = (domainCounts[metadata.domain] ?? 0) + 1;

    if (!skill.frontmatter.name) {
      errors.push({
        path: skillPath,
        field: "name",
        message: "Missing required field: name",
      });
      invalidSkillKeys.add(skill.dirName);
    }

    if (!skill.frontmatter.description) {
      errors.push({
        path: skillPath,
        field: "description",
        message: "Missing required field: description",
      });
      invalidSkillKeys.add(skill.dirName);
    }

    if (!skill.frontmatter.license) {
      errors.push({
        path: skillPath,
        field: "license",
        message: "Missing required field: license",
      });
      invalidSkillKeys.add(skill.dirName);
    }

    if (!metadata.domain) {
      errors.push({
        path: skillPath,
        field: "metadata.domain",
        message: "Missing required field: metadata.domain",
      });
      invalidSkillKeys.add(skill.dirName);
    }

    if (!metadata.author) {
      errors.push({
        path: skillPath,
        field: "metadata.author",
        message: "Missing required field: metadata.author",
      });
      invalidSkillKeys.add(skill.dirName);
    }

    if (!metadata.lastUpdated) {
      errors.push({
        path: skillPath,
        field: "metadata.lastUpdated",
        message: "Missing required field: metadata.lastUpdated",
      });
      invalidSkillKeys.add(skill.dirName);
    }

    if (!metadata.provenance) {
      errors.push({
        path: skillPath,
        field: "metadata.provenance",
        message: "Missing required field: metadata.provenance",
      });
      invalidSkillKeys.add(skill.dirName);
    }

    if (!validateDomain(taxonomy, metadata.domain)) {
      errors.push({
        path: skillPath,
        field: "metadata.domain",
        message: `Invalid domain '${metadata.domain}'`,
      });
      invalidSkillKeys.add(skill.dirName);
    }

    if (metadata.subdomain) {
      if (!validateSubdomain(taxonomy, metadata.domain, metadata.subdomain)) {
        errors.push({
          path: skillPath,
          field: "metadata.subdomain",
          message: `Invalid subdomain '${metadata.subdomain}' for domain '${metadata.domain}'`,
        });
        invalidSkillKeys.add(skill.dirName);
      }
    } else {
      warnings.push({
        path: skillPath,
        field: "metadata.subdomain",
        message: "Missing optional field: metadata.subdomain",
      });
    }

    if (!VALID_PROVENANCE.has(metadata.provenance)) {
      errors.push({
        path: skillPath,
        field: "metadata.provenance",
        message: `Invalid provenance '${metadata.provenance}'`,
      });
      invalidSkillKeys.add(skill.dirName);
    }

    if (!skill.hasNotice) {
      errors.push({
        path: skillPath,
        field: "NOTICE.md",
        message: "Missing required file: NOTICE.md",
      });
      invalidSkillKeys.add(skill.dirName);
    }

    if (skill.dirName !== skill.frontmatter.name) {
      errors.push({
        path: skillPath,
        field: "name",
        message: `Skill directory '${skill.dirName}' does not match name '${skill.frontmatter.name}'`,
      });
      invalidSkillKeys.add(skill.dirName);
    }

    if (!HOLOCENE_DATE_REGEX.test(metadata.lastUpdated)) {
      errors.push({
        path: skillPath,
        field: "metadata.lastUpdated",
        message: `Invalid Holocene date '${metadata.lastUpdated}'`,
      });
      invalidSkillKeys.add(skill.dirName);
    }

    if (description.length > 1024) {
      errors.push({
        path: skillPath,
        field: "description",
        message: "Description exceeds 1024 characters",
      });
      invalidSkillKeys.add(skill.dirName);
    }

    if (description.trim().length === 0) {
      warnings.push({
        path: skillPath,
        field: "description",
        message: "Description is empty",
      });
    }

    if (metadata.tags === undefined) {
      warnings.push({
        path: skillPath,
        field: "metadata.tags",
        message: "Missing optional field: metadata.tags",
      });
    }

    if (metadata.frameworks === undefined) {
      warnings.push({
        path: skillPath,
        field: "metadata.frameworks",
        message: "Missing optional field: metadata.frameworks",
      });
    }
  }

  let totalSkills: number;

  try {
    const skillRoot = join(catalogDir, "skills");
    const entries = await readdir(skillRoot, { withFileTypes: true });
    totalSkills = entries.filter((entry) => entry.isDirectory()).length;
  } catch {
    totalSkills = scanResult.skills.length;
  }

  const invalidSkills = invalidSkillKeys.size;
  const validSkills = Math.max(totalSkills - invalidSkills, 0);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalSkills,
      validSkills,
      invalidSkills,
      domains: Object.fromEntries(
        Object.entries(domainCounts).sort(([a], [b]) => a.localeCompare(b)),
      ),
    },
  };
}
