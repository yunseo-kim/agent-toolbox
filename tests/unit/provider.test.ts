import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import {
  getCacheDir,
  isRunningFromPackageManager,
  resolveCatalogDir,
} from "../../src/catalog/provider.js";
import { existsSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
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
  });
});
