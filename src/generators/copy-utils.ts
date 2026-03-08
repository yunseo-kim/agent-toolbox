import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";

export async function copyDirectoryRecursive(
  src: string,
  dest: string,
): Promise<void> {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectoryRecursive(srcPath, destPath);
    } else {
      const content = await Bun.file(srcPath).arrayBuffer();
      await Bun.write(destPath, content);
    }
  }
}
