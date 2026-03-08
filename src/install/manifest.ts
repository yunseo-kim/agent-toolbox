import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { InstallManifest } from "../schemas/manifest.js";

export const MANIFEST_FILENAME = ".install-manifest.json";

/**
 * Read install manifest from a target directory.
 * Returns null if the file does not exist or is invalid.
 */
export async function readManifest(
  targetDir: string,
): Promise<InstallManifest | null> {
  const path = join(targetDir, MANIFEST_FILENAME);

  try {
    const content = await readFile(path, "utf8");
    const raw: unknown = JSON.parse(content);
    return InstallManifest.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Write install manifest to a target directory.
 */
export async function writeManifest(
  targetDir: string,
  manifest: InstallManifest,
): Promise<void> {
  const path = join(targetDir, MANIFEST_FILENAME);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(manifest, null, 2) + "\n", "utf8");
}

/**
 * Remove skills from an existing manifest.
 * Returns updated manifest, or null if no manifest exists.
 */
export async function removeSkillsFromManifest(
  targetDir: string,
  skillNames: string[],
): Promise<InstallManifest | null> {
  const manifest = await readManifest(targetDir);
  if (!manifest) {
    return null;
  }

  const namesToRemove = new Set(skillNames.map((n) => n.toLowerCase()));
  const updated: InstallManifest = {
    ...manifest,
    skills: manifest.skills.filter(
      (s) => !namesToRemove.has(s.name.toLowerCase()),
    ),
  };

  await writeManifest(targetDir, updated);
  return updated;
}
