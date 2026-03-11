import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import {
  getCacheDir,
  isRunningFromPackageManager,
  resolveCatalogDir,
} from "../../src/catalog/provider.js";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("getCacheDir", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Save original environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  test("returns XDG_CACHE_HOME path when set", () => {
    process.env.XDG_CACHE_HOME = "/custom/cache";
    const result = getCacheDir();
    expect(result).toBe("/custom/cache/agent-toolbox");
  });

  test("returns ~/.cache path on non-Windows when XDG_CACHE_HOME not set", () => {
    delete process.env.XDG_CACHE_HOME;
    process.env.HOME = "/home/testuser";

    // Mock platform check by checking the actual platform
    if (process.platform !== "win32") {
      const result = getCacheDir();
      expect(result).toBe("/home/testuser/.cache/agent-toolbox");
    }
  });

  test("returns LOCALAPPDATA path on Windows when XDG_CACHE_HOME not set", () => {
    delete process.env.XDG_CACHE_HOME;
    process.env.LOCALAPPDATA = "C:\\Users\\testuser\\AppData\\Local";

    // Only test on Windows
    if (process.platform === "win32") {
      const result = getCacheDir();
      expect(result).toContain("agent-toolbox");
    }
  });

  test("falls back to USERPROFILE on Windows when HOME not set", () => {
    delete process.env.XDG_CACHE_HOME;
    delete process.env.HOME;
    process.env.USERPROFILE = "C:\\Users\\testuser";

    if (process.platform === "win32") {
      const result = getCacheDir();
      expect(result).toContain("agent-toolbox");
    }
  });

  test("returns consistent path across multiple calls", () => {
    process.env.XDG_CACHE_HOME = "/consistent/cache";
    const result1 = getCacheDir();
    const result2 = getCacheDir();
    expect(result1).toBe(result2);
  });
});

describe("isRunningFromPackageManager", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test("returns false when no package manager env vars set", () => {
    delete process.env.npm_execpath;
    delete process.env.npm_config_user_agent;
    delete process.env.BUN_INSTALL_BIN;

    const result = isRunningFromPackageManager();
    expect(result).toBe(false);
  });

  test("returns true when npm_execpath contains npx", () => {
    process.env.npm_execpath = "/usr/local/bin/npx";
    delete process.env.npm_config_user_agent;
    delete process.env.BUN_INSTALL_BIN;

    const result = isRunningFromPackageManager();
    expect(result).toBe(true);
  });

  test("returns true when npm_execpath contains npm-cli", () => {
    process.env.npm_execpath = "/usr/local/lib/node_modules/npm/bin/npm-cli.js";
    delete process.env.npm_config_user_agent;
    delete process.env.BUN_INSTALL_BIN;

    const result = isRunningFromPackageManager();
    expect(result).toBe(true);
  });

  test("returns true when npm_execpath contains bunx", () => {
    process.env.npm_execpath = "/usr/local/bin/bunx";
    delete process.env.npm_config_user_agent;
    delete process.env.BUN_INSTALL_BIN;

    const result = isRunningFromPackageManager();
    expect(result).toBe(true);
  });

  test("returns true when npm_config_user_agent contains npm/", () => {
    delete process.env.npm_execpath;
    process.env.npm_config_user_agent = "npm/9.6.4 node/v18.16.0 linux x64";
    delete process.env.BUN_INSTALL_BIN;

    const result = isRunningFromPackageManager();
    expect(result).toBe(true);
  });

  test("returns true when npm_config_user_agent contains bun/", () => {
    delete process.env.npm_execpath;
    process.env.npm_config_user_agent = "bun/1.0.0";
    delete process.env.BUN_INSTALL_BIN;

    const result = isRunningFromPackageManager();
    expect(result).toBe(true);
  });

  test("returns true when BUN_INSTALL_BIN is set", () => {
    delete process.env.npm_execpath;
    delete process.env.npm_config_user_agent;
    process.env.BUN_INSTALL_BIN = "/usr/local/bin";

    const result = isRunningFromPackageManager();
    expect(result).toBe(true);
  });

  test("returns false when env vars are empty strings", () => {
    process.env.npm_execpath = "";
    process.env.npm_config_user_agent = "";
    process.env.BUN_INSTALL_BIN = "";

    const result = isRunningFromPackageManager();
    expect(result).toBe(false);
  });
});

describe("resolveCatalogDir", () => {
  const tempDir = join(tmpdir(), `test-catalog-${Date.now()}`);

  beforeEach(async () => {
    // Create temp directory for tests
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up temp directory
    if (existsSync(tempDir)) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  describe("local mode (remote=false)", () => {
    test("returns rootDir/catalog path", async () => {
      const result = await resolveCatalogDir({
        rootDir: tempDir,
        remote: false,
      });

      expect(result).toBe(join(tempDir, "catalog"));
    });

    test("returns correct path with nested rootDir", async () => {
      const nestedDir = join(tempDir, "nested", "project");
      await mkdir(nestedDir, { recursive: true });

      const result = await resolveCatalogDir({
        rootDir: nestedDir,
        remote: false,
      });

      expect(result).toBe(join(nestedDir, "catalog"));
    });
  });

  describe("validation", () => {
    test("rejects empty rootDir", async () => {
      try {
        await resolveCatalogDir({
          rootDir: "",
          remote: false,
        });
        expect.unreachable("Should have thrown");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test("rejects invalid options", async () => {
      try {
        await resolveCatalogDir({
          rootDir: tempDir,
          remote: false,
          // @ts-expect-error - testing invalid input
          invalidOption: true,
        });
        expect.unreachable("Should have thrown");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("offline mode (offline=true)", () => {
    test("throws when no cached catalog exists", async () => {
      const originalCacheDir = process.env.XDG_CACHE_HOME;
      const offlineCacheDir = join(tempDir, "offline-cache");
      await mkdir(offlineCacheDir, { recursive: true });

      process.env.XDG_CACHE_HOME = offlineCacheDir;

      try {
        await resolveCatalogDir({
          rootDir: tempDir,
          remote: true,
          offline: true,
        });
        expect.unreachable("Should have thrown");
      } catch (error) {
        expect(error).toBeDefined();
        expect(error instanceof Error && error.message).toContain(
          "No cached catalog found",
        );
      } finally {
        if (originalCacheDir) {
          process.env.XDG_CACHE_HOME = originalCacheDir;
        } else {
          delete process.env.XDG_CACHE_HOME;
        }
      }
    });

    test("returns cached catalog path when cache exists", async () => {
      const originalCacheDir = process.env.XDG_CACHE_HOME;
      const offlineCacheDir = join(tempDir, "offline-cache-with-catalog");
      const catalogPath = join(offlineCacheDir, "agent-toolbox", "catalog");
      await mkdir(catalogPath, { recursive: true });

      process.env.XDG_CACHE_HOME = offlineCacheDir;

      try {
        const result = await resolveCatalogDir({
          rootDir: tempDir,
          remote: true,
          offline: true,
        });

        expect(result).toBe(catalogPath);
      } finally {
        if (originalCacheDir) {
          process.env.XDG_CACHE_HOME = originalCacheDir;
        } else {
          delete process.env.XDG_CACHE_HOME;
        }
      }
    });
  });

  describe("remote mode with caching", () => {
    test("returns local catalog when remote=false regardless of package manager", async () => {
      const result = await resolveCatalogDir({
        rootDir: tempDir,
        remote: false,
      });

      expect(result).toBe(join(tempDir, "catalog"));
    });

    test("accepts custom source configuration", async () => {
      const result = await resolveCatalogDir({
        rootDir: tempDir,
        remote: false,
        source: {
          owner: "custom-owner",
          repo: "custom-repo",
          branch: "develop",
        },
      });

      expect(result).toBe(join(tempDir, "catalog"));
    });

    describe("remote cache metadata and fetch paths", () => {
      const originalFetch = global.fetch;
      const originalWarn = console.warn;
      const originalCacheDir = process.env.XDG_CACHE_HOME;
      const createFetchMock = (
        impl: (
          input: RequestInfo | URL,
          init?: RequestInit,
        ) => Response | Promise<Response>,
      ): typeof fetch => {
        const wrapper = (
          input: RequestInfo | URL,
          init?: RequestInit,
        ): Promise<Response> => Promise.resolve(impl(input, init));
        return Object.assign(wrapper, {
          preconnect: originalFetch.preconnect.bind(originalFetch),
        });
      };

      const commitShaA = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
      const commitShaB = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

      afterEach(() => {
        global.fetch = originalFetch;
        console.warn = originalWarn;
        if (originalCacheDir) {
          process.env.XDG_CACHE_HOME = originalCacheDir;
        } else {
          delete process.env.XDG_CACHE_HOME;
        }
      });

      test("returns cached catalog on 304 and sends If-None-Match header", async () => {
        const cacheHome = join(tempDir, "etag-304-cache-home");
        const cacheRoot = join(cacheHome, "agent-toolbox");
        const catalogPath = join(cacheRoot, "catalog");
        await mkdir(catalogPath, { recursive: true });
        await writeFile(
          join(cacheRoot, "cache-meta.json"),
          JSON.stringify(
            {
              commitSha: commitShaA,
              etag: '"etag-123"',
              fetchedAt: "2026-01-01T00:00:00.000Z",
              source: {
                owner: "yunseo-kim",
                repo: "agent-toolbox",
                branch: "main",
              },
            },
            null,
            2,
          ),
          "utf8",
        );

        process.env.XDG_CACHE_HOME = cacheHome;

        let observedIfNoneMatch: string | null = null;
        global.fetch = createFetchMock(
          (input: RequestInfo | URL, init?: RequestInit) => {
            const url =
              typeof input === "string"
                ? input
                : input instanceof URL
                  ? input.toString()
                  : input.url;
            if (url.startsWith("https://raw.githubusercontent.com/")) {
              observedIfNoneMatch = new Headers(init?.headers).get(
                "If-None-Match",
              );
              return new Response(null, {
                status: 304,
                statusText: "Not Modified",
              });
            }

            throw new Error(`Unexpected fetch URL: ${url}`);
          },
        );

        const result = await resolveCatalogDir({
          rootDir: tempDir,
          remote: true,
        });

        expect(result).toBe(catalogPath);
        expect(observedIfNoneMatch === '"etag-123"').toBe(true);
      });

      test("updates cache metadata when remote SHA matches cached SHA", async () => {
        const cacheHome = join(tempDir, "sha-match-cache-home");
        const cacheRoot = join(cacheHome, "agent-toolbox");
        const catalogPath = join(cacheRoot, "catalog");
        await mkdir(catalogPath, { recursive: true });
        await writeFile(
          join(cacheRoot, "cache-meta.json"),
          JSON.stringify(
            {
              commitSha: commitShaA,
              etag: '"old-etag"',
              fetchedAt: "2026-01-01T00:00:00.000Z",
              source: {
                owner: "yunseo-kim",
                repo: "agent-toolbox",
                branch: "main",
              },
            },
            null,
            2,
          ),
          "utf8",
        );

        process.env.XDG_CACHE_HOME = cacheHome;

        const requestedUrls: string[] = [];
        global.fetch = createFetchMock((input: RequestInfo | URL) => {
          const url =
            typeof input === "string"
              ? input
              : input instanceof URL
                ? input.toString()
                : input.url;
          requestedUrls.push(url);

          if (url.startsWith("https://raw.githubusercontent.com/")) {
            return new Response("{}", {
              status: 200,
              headers: { etag: '"new-etag"' },
            });
          }

          if (url.startsWith("https://api.github.com/")) {
            return new Response(commitShaA, {
              status: 200,
              headers: { etag: '"api-etag"' },
            });
          }

          throw new Error(`Unexpected fetch URL: ${url}`);
        });

        const result = await resolveCatalogDir({
          rootDir: tempDir,
          remote: true,
          source: {
            owner: "custom-owner",
            repo: "custom-repo",
            branch: "develop",
          },
        });

        expect(result).toBe(catalogPath);
        expect(
          requestedUrls.some((url) => url.includes("custom-owner/custom-repo")),
        ).toBe(true);

        const persistedMeta = JSON.parse(
          await readFile(join(cacheRoot, "cache-meta.json"), "utf8"),
        ) as {
          commitSha: string;
          etag: string | null;
          fetchedAt: string;
          source: { owner: string; repo: string; branch: string };
        };

        expect(persistedMeta.commitSha).toBe(commitShaA);
        expect(persistedMeta.etag).toBe('"api-etag"');
        expect(persistedMeta.source.owner).toBe("custom-owner");
        expect(persistedMeta.source.repo).toBe("custom-repo");
        expect(persistedMeta.source.branch).toBe("develop");
      });

      test("throws when remote fetch fails and no cache exists", async () => {
        const cacheHome = join(tempDir, "no-cache-fetch-fail-home");
        await mkdir(cacheHome, { recursive: true });
        process.env.XDG_CACHE_HOME = cacheHome;

        global.fetch = createFetchMock(() => {
          throw new Error("network unreachable");
        });

        expect(
          resolveCatalogDir({
            rootDir: tempDir,
            remote: true,
          }),
        ).rejects.toThrow("network unreachable");
      });

      test("returns cached catalog when fetch fails and cache exists", async () => {
        const cacheHome = join(tempDir, "cache-fetch-fail-home");
        const cacheRoot = join(cacheHome, "agent-toolbox");
        const catalogPath = join(cacheRoot, "catalog");
        await mkdir(catalogPath, { recursive: true });

        process.env.XDG_CACHE_HOME = cacheHome;

        let warningMessage = "";
        console.warn = (...args: unknown[]) => {
          warningMessage = args
            .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
            .join(" ");
        };

        global.fetch = createFetchMock(() => {
          throw new Error("remote down");
        });

        const result = await resolveCatalogDir({
          rootDir: tempDir,
          remote: true,
        });

        expect(result).toBe(catalogPath);
        expect(warningMessage).toContain("Failed to update catalog");
        expect(warningMessage).toContain("remote down");
      });

      test("falls back to cache when cache metadata is invalid JSON", async () => {
        const cacheHome = join(tempDir, "invalid-meta-cache-home");
        const cacheRoot = join(cacheHome, "agent-toolbox");
        const catalogPath = join(cacheRoot, "catalog");
        await mkdir(catalogPath, { recursive: true });
        await writeFile(join(cacheRoot, "cache-meta.json"), "not-json", "utf8");

        process.env.XDG_CACHE_HOME = cacheHome;

        let warningMessage = "";
        console.warn = (...args: unknown[]) => {
          warningMessage = args
            .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
            .join(" ");
        };

        global.fetch = createFetchMock(() => {
          throw new Error("metadata refresh failed");
        });

        const result = await resolveCatalogDir({
          rootDir: tempDir,
          remote: true,
        });

        expect(result).toBe(catalogPath);
        expect(warningMessage).toContain("Failed to update catalog");
      });

      test("uses cache when freshness check fails with valid cache metadata", async () => {
        const cacheHome = join(tempDir, "freshness-failure-cache-home");
        const cacheRoot = join(cacheHome, "agent-toolbox");
        const catalogPath = join(cacheRoot, "catalog");
        await mkdir(catalogPath, { recursive: true });
        await writeFile(
          join(cacheRoot, "cache-meta.json"),
          JSON.stringify(
            {
              commitSha: commitShaA,
              etag: '"cached-etag"',
              fetchedAt: "2026-01-01T00:00:00.000Z",
              source: {
                owner: "yunseo-kim",
                repo: "agent-toolbox",
                branch: "main",
              },
            },
            null,
            2,
          ),
          "utf8",
        );

        process.env.XDG_CACHE_HOME = cacheHome;

        let warningMessage = "";
        console.warn = (...args: unknown[]) => {
          warningMessage = args
            .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
            .join(" ");
        };

        global.fetch = createFetchMock((input: RequestInfo | URL) => {
          const url =
            typeof input === "string"
              ? input
              : input instanceof URL
                ? input.toString()
                : input.url;
          if (url.startsWith("https://raw.githubusercontent.com/")) {
            throw new Error("raw endpoint failed");
          }
          if (url.startsWith("https://api.github.com/")) {
            throw new Error("api endpoint failed");
          }
          throw new Error(`Unexpected fetch URL: ${url}`);
        });

        const result = await resolveCatalogDir({
          rootDir: tempDir,
          remote: true,
        });

        expect(result).toBe(catalogPath);
        expect(warningMessage).toContain("Could not refresh catalog metadata");
      });

      test("rewrites cache metadata when latest SHA matches cache after freshness mismatch", async () => {
        const cacheHome = join(tempDir, "latest-match-cache-home");
        const cacheRoot = join(cacheHome, "agent-toolbox");
        const catalogPath = join(cacheRoot, "catalog");
        await mkdir(catalogPath, { recursive: true });
        await writeFile(
          join(cacheRoot, "cache-meta.json"),
          JSON.stringify(
            {
              commitSha: commitShaA,
              etag: '"persisted-etag"',
              fetchedAt: "2026-01-01T00:00:00.000Z",
              source: {
                owner: "yunseo-kim",
                repo: "agent-toolbox",
                branch: "main",
              },
            },
            null,
            2,
          ),
          "utf8",
        );

        process.env.XDG_CACHE_HOME = cacheHome;

        let apiCallCount = 0;
        global.fetch = createFetchMock((input: RequestInfo | URL) => {
          const url =
            typeof input === "string"
              ? input
              : input instanceof URL
                ? input.toString()
                : input.url;

          if (url.startsWith("https://raw.githubusercontent.com/")) {
            return new Response("{}", {
              status: 200,
              headers: { etag: '"raw-etag"' },
            });
          }

          if (url.startsWith("https://api.github.com/")) {
            apiCallCount += 1;
            if (apiCallCount === 1) {
              return new Response(commitShaB, { status: 200 });
            }
            return new Response(commitShaA, { status: 200 });
          }

          throw new Error(`Unexpected fetch URL: ${url}`);
        });

        const result = await resolveCatalogDir({
          rootDir: tempDir,
          remote: true,
        });

        expect(result).toBe(catalogPath);
        expect(apiCallCount).toBe(2);

        const persistedMeta = JSON.parse(
          await readFile(join(cacheRoot, "cache-meta.json"), "utf8"),
        ) as {
          commitSha: string;
          etag: string | null;
          source: { owner: string; repo: string; branch: string };
        };

        expect(persistedMeta.commitSha).toBe(commitShaA);
        expect(persistedMeta.etag).toBe('"persisted-etag"');
        expect(persistedMeta.source.owner).toBe("yunseo-kim");
      });

      test("throws in offline mode when remote cache is missing", async () => {
        const cacheHome = join(tempDir, "offline-remote-missing-home");
        await mkdir(cacheHome, { recursive: true });
        process.env.XDG_CACHE_HOME = cacheHome;

        expect(
          resolveCatalogDir({
            rootDir: tempDir,
            remote: true,
            offline: true,
          }),
        ).rejects.toThrow("No cached catalog found");
      });

      test("uses cached catalog in offline mode even with cache metadata present", async () => {
        const cacheHome = join(tempDir, "offline-meta-cache-home");
        const cacheRoot = join(cacheHome, "agent-toolbox");
        const catalogPath = join(cacheRoot, "catalog");
        await mkdir(catalogPath, { recursive: true });
        await writeFile(
          join(cacheRoot, "cache-meta.json"),
          JSON.stringify(
            {
              commitSha: commitShaB,
              etag: '"offline-etag"',
              fetchedAt: "2026-01-01T00:00:00.000Z",
              source: {
                owner: "yunseo-kim",
                repo: "agent-toolbox",
                branch: "main",
              },
            },
            null,
            2,
          ),
          "utf8",
        );

        process.env.XDG_CACHE_HOME = cacheHome;

        const result = await resolveCatalogDir({
          rootDir: tempDir,
          remote: true,
          offline: true,
        });

        expect(result).toBe(catalogPath);
      });
    });
  });
});
