# Changelog

All notable changes to the agent-toolbox CLI will be documented in this file.

## [0.1.0] - 12026-02-28

### Bug Fixes
- Align skill frontmatter domains with consolidated taxonomy
- *(ci)* Ignore volatile timestamp in drift detection


### Build
- Bootstrap Bun-first TypeScript toolchain


### CI/CD
- Add GitHub Actions CI/CD workflow


### Documentation
- Add AGENTS.md project knowledge base
- Restructure root license with third-party component clause
- Add catalog taxonomy and selective installation architecture
- Restructure README tables and add listing policy to AGENTS.md
- Add hierarchical AGENTS.md for dev tooling and catalog directories
- *(license)* Clarify SUL governance in all catalog NOTICE.md files
- *(readme)* Add ported and external skill entries
- *(AGENTS)* Add catalog curation scope policy
- Update README and catalog metadata for awesome-llm-apps batch
- Center README header
- Add provenance classification guide
- Codify ported skill body integrity convention
- Add hierarchical AGENTS.md knowledge base via init-deep
- Restructure documentation
- Use bunx/npx install UX in README examples


### Features
- *(schemas)* Add Zod schemas for catalog and target types
- *(cli)* Add validate and build-index commands
- *(generators)* Add shared interface and copy utilities
- *(generators)* Add Claude Code and OpenCode generators
- *(generators)* Add Cursor, Codex, and Gemini generators
- *(cli)* Add build-target command
- *(install)* Add selective install engine
- *(cli)* Add unified entrypoint with subcommand routing
- *(release)* Add release infrastructure with bumpp, git-cliff, and GitHub Actions
- *(cli)* Add runtime catalog provider with ETag-based freshness check


### Miscellaneous
- Create .gitignore
- Update LICENSE copyright to Holocene Era year notation
- *(license)* Switch to SUL 1.0 and clarify attribution structure
- Add frontmatter migration script
- *(scripts)* Add provenance audit and sync tooling


### Refactoring
- Remove source-repo-specific assumptions from profiles
- Consolidate taxonomy by merging testing into devops and adding disambiguation rules


### Testing
- Add unit and integration test suite

