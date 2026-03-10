# Changelog

All notable changes to the agent-toolbox CLI will be documented in this file.

## [0.2.0] - 12026-03-10

### Bug Fixes
- Correct README path typo and fix pre-commit hook configuration (#9)


### CI/CD
- *(security)* Integrate Cisco Skill Scanner for automated skill security vetting (#8)
- *(security)* Add verbose, incremental scanning, and monthly report archiving to skill-scanner (#11)
- *(security)* Tune skill-scanner models and verbose dispatch handling (#12)
- *(security)* Resolve skill-scanner verbose input merge markers (#13)
- Add ESLint and Prettier checks to CI and release pipelines (#20)
- *(scanner)* Enable VirusTotal unknown-file upload (#24)
- *(scanner)* Output markdown reports on PR scans and remove push trigger (#25)
- *(scanner)* Add push trigger with lightweight scan and PR concurrency (#29)


### Documentation
- Expand Why section with security vetting rationale and update package metadata (#3)
- Add security policy and update README Contributing section (#5)
- *(security)* Replace double hyphens with em dashes for proper rendering (#6)
- *(skill)* Refine catalog-porter references and add SPDX license guidance (#10)
- Lowercase docs/ filenames and update all references (#15)
- Update AGENTS.md hierarchy for ESLint, Prettier, and Lefthook (#18)
- Add known issues tracking document (#21)
- *(cli)* Add dual-runtime architecture reference (#23)
- *(security)* March 12026 security scan report & catalog hardening (#14)
- *(readme)* Overhaul README and add CONTRIBUTING.md (#28)


### Features
- *(cli)* Add list, find, remove, check, update commands (#19)
- *(cli)* Add dual-runtime build pipeline for npx and bunx support (#22)


### Miscellaneous
- V0.2.0 prep — branch protection, zod v4, npm package trim (#1)
- Update Buy Me a Coffee username in FUNDING.yml (#2)
- Rename project and release docs (#16)
- Set up ESLint, Prettier, and Lefthook (#17)
- *(github)* Add pull request template (#26)


## [0.1.0] - 12026-02-28

### Bug Fixes
- Correct find-skills LICENSE copyright holder to Vercel, Inc.
- Align skill frontmatter domains with consolidated taxonomy
- *(ci)* Ignore volatile timestamp in drift detection


### Build
- Bootstrap Bun-first TypeScript toolchain


### CI/CD
- Add GitHub Actions CI/CD workflow


### Documentation
- Add AGENTS.md project knowledge base
- Add license notice for git-master (Sustainable Use License 1.0)
- Strengthen generic checklist and templates in docs-writer
- Add reusable templates resource to docs-writer workflow
- Add license notices for docs-writer (MIT + Apache 2.0 attribution)
- Restructure root license with third-party component clause
- Add license notice for github-triage (Sustainable Use License 1.0)
- Add catalog taxonomy and selective installation architecture
- Add n8n-derived catalog skills to README
- Restructure README tables and add listing policy to AGENTS.md
- Add hierarchical AGENTS.md for dev tooling and catalog directories
- *(license)* Clarify SUL governance in all catalog NOTICE.md files
- *(readme)* Add ported and external skill entries
- Add openclaw skill entries and reference
- *(AGENTS)* Add catalog curation scope policy
- *(readme)* Add 33-js-concepts skill entries and reference
- Update README and catalog metadata for awesome-llm-apps batch
- Add dify skills and reference to README
- Center README header
- *(readme)* Add vercel/streamdown to references table
- Add provenance classification guide
- Codify ported skill body integrity convention
- Add hierarchical AGENTS.md knowledge base via init-deep
- Restructure documentation
- Use bunx/npx install UX in README examples


### Features
- Enhance git-master with advanced workflow playbooks
- Add first two skills from n8n
- Add content-design and issue-analysis skills from n8n
- Add create-pr skill from n8n (generalized)
- Add docs-writer synthesized skill from multiple upstream sources
- *(taxonomy)* Add developer-tooling, communications, generative-art subdomains
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
- Add upstream git-master skill baseline
- Add create-pr skill from n8n-io/n8n
- Add github-triage skill from oh-my-opencode
- Add skill-creator and mcp-builder skills from anthropics/skills
- Update LICENSE copyright to Holocene Era year notation
- Add find-skills skill from vercel-labs/skills
- Add 5 skills from wshobson/agents
- Add update-docs skill from vercel/next.js
- Add consolidated docs-writer skill with profile references
- Remove update-docs skill (superseded by docs-writer)
- Add doc-coauthoring skill from anthropics/skills
- Add docs-changelog skill from google-gemini/gemini-cli
- Sync dev tooling create-pr skill with generalized catalog version
- *(license)* Switch to SUL 1.0 and clarify attribution structure
- Add frontmatter migration script
- *(scripts)* Add provenance audit and sync tooling


### Refactoring
- Make docs-writer self-contained and remove gemini profile
- Remove source-repo-specific assumptions from profiles
- Consolidate taxonomy by merging testing into devops and adding disambiguation rules


### Testing
- Add unit and integration test suite

