import type { ParsedSkill } from "../schemas/catalog.js";

export interface SearchResult {
  skill: ParsedSkill;
  score: number;
  matchedFields: string[];
}

/**
 * Search skills by keyword with weighted scoring.
 * Matches against name, description, domain, subdomain, tags, and frameworks.
 * Returns results sorted by relevance score (descending).
 */
export function searchSkills(
  skills: ParsedSkill[],
  query: string,
): SearchResult[] {
  if (!query || query.trim() === "") {
    return skills.map((skill) => ({ skill, score: 0, matchedFields: [] }));
  }

  const q = query.toLowerCase().trim();
  const results: SearchResult[] = [];

  for (const skill of skills) {
    let score = 0;
    const matchedFields: string[] = [];

    const name = skill.frontmatter.name.toLowerCase();
    const description = skill.frontmatter.description.toLowerCase();
    const domain = skill.frontmatter.metadata.domain.toLowerCase();
    const subdomain = skill.frontmatter.metadata.subdomain?.toLowerCase() ?? "";
    const tags = skill.frontmatter.metadata.tags ?? [];
    const frameworks = skill.frontmatter.metadata.frameworks ?? [];

    // Name exact match (highest priority)
    if (name === q) {
      score += 100;
      matchedFields.push("name");
    } else if (name.includes(q)) {
      score += 50;
      matchedFields.push("name");
    }

    // Tag exact match
    for (const tag of tags) {
      if (tag.toLowerCase() === q) {
        score += 30;
        matchedFields.push("tags");
        break;
      }
    }

    // Framework exact match
    for (const fw of frameworks) {
      if (fw.toLowerCase() === q) {
        score += 30;
        matchedFields.push("frameworks");
        break;
      }
    }

    // Domain/subdomain match
    if (domain === q || domain.includes(q)) {
      score += 20;
      matchedFields.push("domain");
    }
    if (subdomain && (subdomain === q || subdomain.includes(q))) {
      score += 20;
      matchedFields.push("subdomain");
    }

    // Description contains (lowest priority)
    if (description.includes(q)) {
      score += 10;
      matchedFields.push("description");
    }

    if (score > 0) {
      results.push({ skill, score, matchedFields });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
