import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";

export interface CatalogSource {
  owner: string;
  repo: string;
  branch: string;
}

export interface CatalogResolveOptions {
  rootDir: string;
  remote?: boolean;
  refresh?: boolean;
  offline?: boolean;
  source?: Partial<CatalogSource>;
}

interface CacheMeta {
  commitSha: string;
  etag: string | null;
  fetchedAt: string;
  source: CatalogSource;
}

const DEFAULT_SOURCE: CatalogSource = {
  owner: "yunseo-kim",
  repo: "agent-toolbox",
  branch: "main",
};

const USER_AGENT = "agent-toolbox-cli";

const CatalogSourceSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  branch: z.string().min(1),
});

const CatalogResolveOptionsSchema = z.object({
  rootDir: z.string().min(1),
  remote: z.boolean().optional(),
  refresh: z.boolean().optional(),
  offline: z.boolean().optional(),
  source: CatalogSourceSchema.partial().optional(),
});

const CommitShaSchema = z.string().regex(/^[0-9a-f]{40}$/i, "Invalid commit SHA");

const CacheMetaSchema = z.object({
  commitSha: CommitShaSchema,
  etag: z.string().nullable(),
  fetchedAt: z.iso.datetime({ offset: true }),
  source: CatalogSourceSchema,
});

type FetchWithEtagResult = {
  status: number;
  body: string | null;
  etag: string | null;
};

type FreshnessResult =
  | {
      notModified: true;
      etag: string | null;
    }
  | {
      notModified: false;
      sha: string;
      etag: string | null;
    };

export function getCacheDir(): string {
  const xdgCacheHome = process.env.XDG_CACHE_HOME;
  if (xdgCacheHome) {
    return join(xdgCacheHome, "agent-toolbox");
  }

  const home = process.env.HOME ?? process.env.USERPROFILE ?? "";

  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA ?? join(home, "AppData", "Local");
    return join(localAppData, "agent-toolbox");
  }

  return join(home, ".cache", "agent-toolbox");
}

async function fetchWithETag(
  url: string,
  cachedEtag: string | null,
  headers?: Record<string, string>,
): Promise<FetchWithEtagResult> {
  const requestHeaders: Record<string, string> = {
    "User-Agent": USER_AGENT,
    ...headers,
  };

  if (cachedEtag) {
    requestHeaders["If-None-Match"] = cachedEtag;
  }

  const response = await fetch(url, { headers: requestHeaders, redirect: "follow" });

  if (response.status === 304) {
    return {
      status: 304,
      body: null,
      etag: cachedEtag,
    };
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}: ${response.statusText}`);
  }

  return {
    status: response.status,
    body: await response.text(),
    etag: response.headers.get("etag"),
  };
}

async function fetchCommitShaFromApi(source: CatalogSource, cachedEtag: string | null): Promise<FreshnessResult> {
  const url = `https://api.github.com/repos/${source.owner}/${source.repo}/commits/${source.branch}`;
  const result = await fetchWithETag(url, cachedEtag, {
    Accept: "application/vnd.github.sha",
    "X-GitHub-Api-Version": "2022-11-28",
  });

  if (result.status === 304) {
    return {
      notModified: true,
      etag: result.etag,
    };
  }

  const sha = CommitShaSchema.parse((result.body ?? "").trim());

  return {
    notModified: false,
    sha,
    etag: result.etag,
  };
}

async function checkCatalogFreshness(source: CatalogSource, cachedEtag: string | null): Promise<FreshnessResult> {
  const rawUrl = `https://raw.githubusercontent.com/${source.owner}/${source.repo}/${source.branch}/catalog/metadata/skill-index.json`;

  try {
    const rawResult = await fetchWithETag(rawUrl, cachedEtag, {
      Accept: "application/json",
    });

    if (rawResult.status === 304) {
      return {
        notModified: true,
        etag: rawResult.etag,
      };
    }

    return await fetchCommitShaFromApi(source, null);
  } catch (primaryError) {
    try {
      return await fetchCommitShaFromApi(source, cachedEtag);
    } catch (secondaryError) {
      const primaryReason = primaryError instanceof Error ? primaryError.message : String(primaryError);
      const secondaryReason = secondaryError instanceof Error ? secondaryError.message : String(secondaryError);
      throw new Error(
        `Failed to check catalog updates via raw.githubusercontent.com (${primaryReason}) and GitHub API (${secondaryReason})`,
      );
    }
  }
}

async function fetchLatestCommitSha(source: CatalogSource): Promise<string> {
  const latest = await fetchCommitShaFromApi(source, null);
  if (latest.notModified) {
    throw new Error("Unexpected 304 response while fetching latest commit SHA");
  }
  return latest.sha;
}

async function downloadAndExtractCatalog(source: CatalogSource, sha: string, cacheRoot: string): Promise<void> {
  const tarUrl = `https://codeload.github.com/${source.owner}/${source.repo}/tar.gz/${sha}`;
  const response = await fetch(tarUrl, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Failed to download catalog archive: HTTP ${response.status}`);
  }

  const tmpRoot = join(cacheRoot, ".tmp-catalog");
  const archivePath = join(tmpRoot, "catalog.tar.gz");
  const stageDir = join(cacheRoot, "catalog.next");
  const catalogDir = join(cacheRoot, "catalog");

  await rm(tmpRoot, { recursive: true, force: true });
  await rm(stageDir, { recursive: true, force: true });
  await mkdir(tmpRoot, { recursive: true });

  const archive = await response.arrayBuffer();
  await Bun.write(archivePath, archive);

  const extractProc = Bun.spawn(["tar", "xzf", archivePath, "-C", tmpRoot], {
    stdout: "ignore",
    stderr: "pipe",
  });
  const exitCode = await extractProc.exited;

  if (exitCode !== 0) {
    const stderr = await new Response(extractProc.stderr).text();
    throw new Error(`Catalog archive extraction failed (exit ${exitCode}): ${stderr.trim()}`);
  }

  const extractedEntries = await readdir(tmpRoot, { withFileTypes: true });
  const repoDir = extractedEntries.find((entry) => entry.isDirectory())?.name;

  if (!repoDir) {
    throw new Error("Catalog archive did not contain repository directory");
  }

  const extractedCatalogDir = join(tmpRoot, repoDir, "catalog");
  if (!existsSync(extractedCatalogDir)) {
    throw new Error("Catalog archive does not contain catalog/ directory");
  }

  await rename(extractedCatalogDir, stageDir);
  await rm(catalogDir, { recursive: true, force: true });
  await rename(stageDir, catalogDir);
  await rm(tmpRoot, { recursive: true, force: true });
}

async function readCacheMeta(cacheRoot: string): Promise<CacheMeta | null> {
  const path = join(cacheRoot, "cache-meta.json");

  try {
    const content = await readFile(path, "utf8");
    const raw = JSON.parse(content);
    return CacheMetaSchema.parse(raw);
  } catch {
    return null;
  }
}

async function writeCacheMeta(cacheRoot: string, meta: CacheMeta): Promise<void> {
  const path = join(cacheRoot, "cache-meta.json");
  await mkdir(cacheRoot, { recursive: true });
  await writeFile(path, JSON.stringify(meta, null, 2), "utf8");
}

export function isRunningFromPackageManager(): boolean {
  const npmExecPath = process.env.npm_execpath ?? "";
  const npmUserAgent = process.env.npm_config_user_agent ?? "";
  const bunxMode = process.env.BUN_INSTALL_BIN ?? "";

  return (
    npmExecPath.includes("npx")
    || npmExecPath.includes("npm-cli")
    || npmExecPath.includes("bunx")
    || npmUserAgent.includes("npm/")
    || npmUserAgent.includes("bun/")
    || bunxMode.length > 0
  );
}

export async function resolveCatalogDir(options: CatalogResolveOptions): Promise<string> {
  const parsedOptions = CatalogResolveOptionsSchema.parse(options);
  const source = CatalogSourceSchema.parse({
    ...DEFAULT_SOURCE,
    ...parsedOptions.source,
  });

  const shouldUseRemote = parsedOptions.remote ?? isRunningFromPackageManager();
  if (!shouldUseRemote) {
    return join(parsedOptions.rootDir, "catalog");
  }

  const cacheRoot = getCacheDir();
  const catalogDir = join(cacheRoot, "catalog");
  const hasCachedCatalog = existsSync(catalogDir);

  if (parsedOptions.offline) {
    if (!hasCachedCatalog) {
      throw new Error("No cached catalog found. Run once without --offline to download catalog data.");
    }
    return catalogDir;
  }

  const cacheMeta = await readCacheMeta(cacheRoot);

  if (!parsedOptions.refresh && hasCachedCatalog && cacheMeta) {
    try {
      const freshness = await checkCatalogFreshness(source, cacheMeta.etag);
      if (freshness.notModified) {
        return catalogDir;
      }

      if (freshness.sha === cacheMeta.commitSha) {
        await writeCacheMeta(cacheRoot, {
          ...cacheMeta,
          etag: freshness.etag ?? cacheMeta.etag,
          fetchedAt: new Date().toISOString(),
          source,
        });
        return catalogDir;
      }
    } catch (error) {
      if (hasCachedCatalog) {
        const reason = error instanceof Error ? error.message : String(error);
        console.warn(`Could not refresh catalog metadata (${reason}). Using cached catalog.`);
        return catalogDir;
      }
      throw error;
    }
  }

  try {
    const sha = await fetchLatestCommitSha(source);

    if (!parsedOptions.refresh && cacheMeta?.commitSha === sha && hasCachedCatalog) {
      await writeCacheMeta(cacheRoot, {
        ...cacheMeta,
        commitSha: sha,
        fetchedAt: new Date().toISOString(),
        source,
      });
      return catalogDir;
    }

    await mkdir(cacheRoot, { recursive: true });
    await downloadAndExtractCatalog(source, sha, cacheRoot);
    await writeCacheMeta(cacheRoot, {
      commitSha: sha,
      etag: cacheMeta?.etag ?? null,
      fetchedAt: new Date().toISOString(),
      source,
    });

    return catalogDir;
  } catch (error) {
    if (hasCachedCatalog) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(`Failed to update catalog (${reason}). Using cached catalog.`);
      return catalogDir;
    }
    throw error;
  }
}
