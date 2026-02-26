import type { ParsedSkill } from "../schemas/catalog.js";
import type { InstallFilters } from "../schemas/install.js";

export interface FilterResult {
  /** Skills that passed all filters */
  matched: ParsedSkill[];
  /** Total skills before filtering */
  total: number;
  /** Filters that were applied */
  appliedFilters: string[];
}

/**
 * Filter skills based on install options.
 * Multiple filters compose with AND logic.
 * No filters = all skills.
 */
export function filterSkills(skills: ParsedSkill[], filters: InstallFilters): FilterResult {
  let matched = [...skills];
  const appliedFilters: string[] = [];
  const total = skills.length;

  if (filters.domain) {
    matched = matched.filter((skill) => skill.frontmatter.metadata.domain === filters.domain);
    appliedFilters.push(`domain=${filters.domain}`);
  }

  if (filters.subdomain) {
    matched = matched.filter((skill) => skill.frontmatter.metadata.subdomain === filters.subdomain);
    appliedFilters.push(`subdomain=${filters.subdomain}`);
  }

  if (filters.framework) {
    const framework = filters.framework.toLowerCase();
    matched = matched.filter((skill) => {
      const frameworks = skill.frontmatter.metadata.frameworks;
      if (!frameworks) {
        return false;
      }
      return frameworks.some((entry) => entry.toLowerCase() === framework);
    });
    appliedFilters.push(`framework=${filters.framework}`);
  }

  if (filters.tag) {
    const tag = filters.tag.toLowerCase();
    matched = matched.filter((skill) => {
      const tags = skill.frontmatter.metadata.tags;
      if (!tags) {
        return false;
      }
      return tags.some((entry) => entry.toLowerCase() === tag);
    });
    appliedFilters.push(`tag=${filters.tag}`);
  }

  if (filters.skill && filters.skill.length > 0) {
    const names = new Set(filters.skill.map((name) => name.toLowerCase()));
    matched = matched.filter((skill) => names.has(skill.frontmatter.name.toLowerCase()));
    appliedFilters.push(`skill=${filters.skill.join(",")}`);
  }

  return { matched, total, appliedFilters };
}
