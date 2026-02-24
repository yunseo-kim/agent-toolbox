# Attribution Notice

This skill incorporates material derived from
[langgenius/dify](https://github.com/langgenius/dify) (`.agents/skills/frontend-testing`),
originally released under the
[Apache License 2.0 (modified)](https://github.com/langgenius/dify/blob/main/LICENSE).
This adapted version is governed by the
[Sustainable Use License](../../LICENSE.md) at the root of this repository.
The upstream license terms are reproduced below for attribution.

## Modifications

This skill has been adapted from the original Dify frontend-testing skill
for use in the awesome-agent-toolbox catalog. Changes include:

- Removed all Dify-specific CLI commands (`pnpm analyze-component`, `pnpm refactor-component`)
- Removed Dify-specific file path references (`web/`, `web/vitest.config.ts`, `web/docs/test.md`)
- Removed Dify-specific domain component testing guide (workflow nodes, dataset components, configuration components)
- Generalized Zustand store mocking patterns to apply to any Zustand-based project
- Generalized mock setup references to use standard Vitest conventions instead of Dify-specific globals
- Retained and adapted all universal testing patterns: AAA, black-box, incremental workflow, async testing, mocking guide, common patterns, and test templates
- Adapted all three test templates (component, hook, utility) to remove Dify-specific comments while preserving the instructional structure

## Upstream License

```
Open Source License

Dify is licensed under a modified version of the Apache License 2.0, with the
following additional conditions:

1. Dify may be utilized commercially, including as a backend service for other
applications or as an application development platform for enterprises. Should
the conditions below be met, a commercial license must be obtained from the
producer:

a. Multi-tenant service: Unless explicitly authorized by Dify in writing, you
   may not use the Dify source code to operate a multi-tenant environment.
   - Tenant Definition: Within the context of Dify, one tenant corresponds to
     one workspace. The workspace provides a separated area for each tenant's
     data and configurations.

b. LOGO and copyright information: In the process of using Dify's frontend,
   you may not remove or modify the LOGO or copyright information in the Dify
   console or applications. This restriction is inapplicable to uses of Dify
   that do not involve its frontend.
   - Frontend Definition: For the purposes of this license, the "frontend" of
     Dify includes all components located in the `web/` directory when running
     Dify from the raw source code, or the "web" image when running Dify with
     Docker.

2. As a contributor, you should agree that:

a. The producer can adjust the open-source agreement to be more strict or
   relaxed as deemed necessary.
b. Your contributed code may be used for commercial purposes, including but
   not limited to its cloud business operations.

Apart from the specific conditions mentioned above, all other rights and
restrictions follow the Apache License 2.0. Detailed information about the
Apache License 2.0 can be found at http://www.apache.org/licenses/LICENSE-2.0.

The interactive design of this product is protected by appearance patent.

(c) 2025 LangGenius, Inc.
```

For the full upstream license text, see:
<https://github.com/langgenius/dify/blob/main/LICENSE>
