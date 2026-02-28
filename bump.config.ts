import { execSync } from "node:child_process";
import { defineConfig } from "bumpp";

export default defineConfig({
  all: true,
  commit: "chore(release): v%s",
  tag: "v%s",
  push: true,
  execute({ state: { newVersion } }) {
    execSync(`git cliff --tag v${newVersion} -o CHANGELOG.md`, {
      stdio: "inherit",
    });
  },
});
