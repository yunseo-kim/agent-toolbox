import { execSync } from "node:child_process";
import { defineConfig } from "bumpp";

export default defineConfig({
  all: true,
  commit: "chore(release): v%s",
  tag: false,
  push: false,
  execute({ state: { newVersion } }) {
    execSync(`git cliff --tag v${newVersion} -o CHANGELOG.md`, {
      stdio: "inherit",
    });
  },
});
