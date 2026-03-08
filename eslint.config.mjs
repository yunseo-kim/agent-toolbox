// @ts-check
import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default defineConfig(
  {
    ignores: [
      // Auto-generated (do not hand-edit; see AGENTS.md)
      "dist/",
      "CHANGELOG.md",
      "bun.lock",
      "catalog/metadata/skill-index.json",
      "catalog/metadata/skill-index.toon",

      // Legal document
      "LICENSE.md",

      // Catalog skills (preserve upstream formatting for sync eligibility; see AGENTS.md)
      "catalog/skills/",

      // Dev tooling skills (authored instructional content with intentional formatting)
      ".agents/",
      ".agent/",
      ".claude/",
      ".cursor/",
      ".windsurf/",
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  eslintConfigPrettier,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
