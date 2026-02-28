import contextlib
import base64
import hashlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, call, patch

import sync


def make_cache(version=3, skills=None, adapted=None):
    """Create a test cache dict."""
    return {
        "version": version,
        "skills": dict(skills or {}),
        "adapted_skills": dict(adapted or {}),
    }


def make_tree(**paths):
    """Create a tree dict from keyword args."""
    return dict(paths)


def make_report(
    safe=None,
    review=None,
    deleted=None,
    new_skills=None,
    errors=None,
    adapted_changed=None,
    adapted_deleted=None,
):
    """Create a report dict with sync.py expected keys."""
    return {
        "safe": list(safe or []),
        "review": list(review or []),
        "deleted": list(deleted or []),
        "new_skills": list(new_skills or []),
        "errors": list(errors or []),
        "adapted_changed": list(adapted_changed or []),
        "adapted_deleted": list(adapted_deleted or []),
    }


def _cp_ok(stdout="", stderr=""):
    obj = MagicMock()
    obj.returncode = 0
    obj.stdout = stdout
    obj.stderr = stderr
    return obj


def _cp_fail(stderr="boom"):
    obj = MagicMock()
    obj.returncode = 1
    obj.stdout = ""
    obj.stderr = stderr
    return obj


class TempCatalogTestCase(unittest.TestCase):
    def setUp(self):
        super().setUp()
        self.tmpdir = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmpdir.cleanup)
        self.catalog_root = Path(self.tmpdir.name)
        self.catalog_patch = patch.object(sync, "CATALOG_SKILLS", self.catalog_root)
        self.catalog_patch.start()
        self.addCleanup(self.catalog_patch.stop)


class TestCacheMigration(unittest.TestCase):
    def setUp(self):
        super().setUp()
        self.tmpdir = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmpdir.cleanup)
        self.cache_path = Path(self.tmpdir.name) / "sha-cache.json"
        self.cache_patch = patch.object(sync, "CACHE_PATH", self.cache_path)
        self.cache_patch.start()
        self.addCleanup(self.cache_patch.stop)

    def test_v1_to_v2_to_v3_chain_migration(self):
        data = {
            "version": 1,
            "skills": {
                "demo": {
                    "upstream_body_sha256": "abc",
                    "last_checked": "12026-01-01T00:00:00+00:00",
                }
            },
        }
        self.cache_path.write_text(json.dumps(data))

        cache = sync.load_cache()

        self.assertEqual(cache["version"], 3)
        self.assertIn("adapted_skills", cache)
        self.assertEqual(cache["skills"]["demo"]["upstream_body_sha256"], "abc")
        self.assertEqual(
            cache["skills"]["demo"]["last_checked"], "12026-01-01T00:00:00+00:00"
        )
        self.assertEqual(cache["skills"]["demo"]["file_hashes"], {})
        self.assertEqual(cache["skills"]["demo"]["tree_shas"], {})

    def test_v2_to_v3_adds_file_hashes_and_tree_shas_everywhere(self):
        data = {
            "version": 2,
            "skills": {
                "ported": {
                    "upstream_body_sha256": "h1",
                    "last_checked": "x",
                    "upstream_sections": ["## A"],
                }
            },
            "adapted_skills": {
                "adapted": {
                    "upstream_body_sha256": "h2",
                    "last_checked": "y",
                    "upstream_sections": ["## B"],
                }
            },
        }
        self.cache_path.write_text(json.dumps(data))

        cache = sync.load_cache()

        self.assertEqual(cache["version"], 3)
        for section in ("skills", "adapted_skills"):
            for entry in cache[section].values():
                self.assertIn("file_hashes", entry)
                self.assertIn("tree_shas", entry)

    def test_v3_cache_loads_unchanged(self):
        data = make_cache(
            skills={
                "demo": {
                    "upstream_body_sha256": "abc",
                    "last_checked": "now",
                    "file_hashes": {"a.md": "h"},
                    "tree_shas": {"a.md": "t"},
                }
            },
            adapted={
                "ad": {
                    "upstream_body_sha256": "def",
                    "upstream_sections": ["## X"],
                    "last_checked": "then",
                    "file_hashes": {},
                    "tree_shas": {},
                }
            },
        )
        self.cache_path.write_text(json.dumps(data))

        loaded = sync.load_cache()

        self.assertEqual(loaded, data)

    def test_missing_or_empty_cache_returns_v3_default(self):
        self.assertEqual(
            sync.load_cache(), {"version": 3, "skills": {}, "adapted_skills": {}}
        )

        self.cache_path.write_text("{}")
        self.assertEqual(
            sync.load_cache(), {"version": 3, "skills": {}, "adapted_skills": {}}
        )

    def test_migration_preserves_existing_fields(self):
        data = {
            "version": 2,
            "skills": {
                "demo": {
                    "upstream_body_sha256": "body-hash",
                    "last_checked": "checked-ts",
                    "upstream_sections": ["## Keep"],
                }
            },
            "adapted_skills": {
                "ad": {
                    "upstream_body_sha256": "adapted-hash",
                    "last_checked": "adapted-ts",
                    "upstream_sections": ["## Adapted Keep"],
                }
            },
        }
        self.cache_path.write_text(json.dumps(data))

        loaded = sync.load_cache()

        self.assertEqual(loaded["skills"]["demo"]["upstream_body_sha256"], "body-hash")
        self.assertEqual(loaded["skills"]["demo"]["last_checked"], "checked-ts")
        self.assertEqual(loaded["skills"]["demo"]["upstream_sections"], ["## Keep"])
        self.assertEqual(
            loaded["adapted_skills"]["ad"]["upstream_body_sha256"], "adapted-hash"
        )
        self.assertEqual(loaded["adapted_skills"]["ad"]["last_checked"], "adapted-ts")
        self.assertEqual(
            loaded["adapted_skills"]["ad"]["upstream_sections"], ["## Adapted Keep"]
        )


class TestListSkillFiles(unittest.TestCase):
    def test_basic_filtering_by_prefix(self):
        tree = make_tree(
            **{
                "skills/demo/SKILL.md": "s1",
                "skills/demo/rules/a.md": "s2",
                "skills/other/SKILL.md": "s3",
            }
        )

        result = sync.list_skill_files(tree, "skills/demo/")

        self.assertEqual(
            result,
            {
                "SKILL.md": "s1",
                "rules/a.md": "s2",
            },
        )

    def test_excludes_local_only_files(self):
        tree = make_tree(**{"skills/demo/NOTICE.md": "n1", "skills/demo/SKILL.md": "s1"})

        result = sync.list_skill_files(tree, "skills/demo/")

        self.assertNotIn("NOTICE.md", result)
        self.assertIn("SKILL.md", result)

    def test_skill_md_included(self):
        tree = make_tree(**{"skills/demo/SKILL.md": "sha"})
        result = sync.list_skill_files(tree, "skills/demo/")
        self.assertEqual(result, {"SKILL.md": "sha"})

    def test_empty_tree_returns_empty(self):
        self.assertEqual(sync.list_skill_files({}, "skills/demo/"), {})

    def test_other_skill_dirs_excluded(self):
        tree = make_tree(
            **{"skills/demo/a.md": "1", "skills/demo-2/b.md": "2", "skills/x/c.md": "3"}
        )
        result = sync.list_skill_files(tree, "skills/demo/")
        self.assertEqual(result, {"a.md": "1"})

    def test_nested_subdirectories_supported(self):
        tree = make_tree(**{"skills/demo/rules/advanced-event-handler-refs.md": "sha1"})
        result = sync.list_skill_files(tree, "skills/demo/")
        self.assertEqual(result, {"rules/advanced-event-handler-refs.md": "sha1"})


class TestIsBinaryFile(unittest.TestCase):
    def test_known_binary_extensions(self):
        for name in ["a.png", "a.jpg", "a.gif", "a.woff2", "a.pdf", "a.zip", "a.pyc"]:
            with self.subTest(name=name):
                self.assertTrue(sync.is_binary_file(name))

    def test_non_binary_extensions(self):
        for name in ["a.md", "a.py", "a.ts", "a.json", "a.yaml", "a.txt"]:
            with self.subTest(name=name):
                self.assertFalse(sync.is_binary_file(name))

    def test_case_insensitivity(self):
        self.assertTrue(sync.is_binary_file("A.PNG"))
        self.assertTrue(sync.is_binary_file("A.Jpg"))

    def test_paths_with_directories(self):
        self.assertTrue(sync.is_binary_file("scripts/image.png"))


class TestHashing(unittest.TestCase):
    def test_sha256_and_sha256_bytes_match(self):
        text = "same-content"
        self.assertEqual(sync.sha256(text), sync.sha256_bytes(text.encode()))

    def test_different_content_produces_different_hashes(self):
        self.assertNotEqual(sync.sha256("a"), sync.sha256("b"))

    def test_empty_content(self):
        expected = hashlib.sha256(b"").hexdigest()
        self.assertEqual(sync.sha256(""), expected)
        self.assertEqual(sync.sha256_bytes(b""), expected)


class TestFetchRepoTree(unittest.TestCase):
    @patch("sync.gh_api")
    def test_parses_tab_separated_path_sha_lines(self, mock_gh_api):
        mock_gh_api.return_value = _cp_ok("a.md\tsha1\nb/c.md\tsha2\n")

        tree = sync.fetch_repo_tree("o/r", "main")

        self.assertEqual(tree, {"a.md": "sha1", "b/c.md": "sha2"})

    @patch("sync.gh_api")
    def test_empty_or_error_response_returns_empty_dict(self, mock_gh_api):
        mock_gh_api.return_value = _cp_ok("")
        self.assertEqual(sync.fetch_repo_tree("o/r", "main"), {})

        mock_gh_api.return_value = _cp_fail("bad")
        self.assertEqual(sync.fetch_repo_tree("o/r", "main"), {})

    @patch("sync.gh_api")
    def test_calls_gh_api_with_blob_only_jq_filter(self, mock_gh_api):
        mock_gh_api.return_value = _cp_ok("")

        sync.fetch_repo_tree("o/r", "main")

        _, kwargs = mock_gh_api.call_args
        self.assertIn('select(.type == "blob")', kwargs["jq"])


class TestFetchRawBinary(unittest.TestCase):
    """Tests for fetch_raw_binary using JSON contents API + base64 decode."""

    @patch("sync.subprocess.run")
    def test_decodes_base64_content_to_bytes(self, mock_run):
        binary_content = b"\x89PNG\r\n\x1a\n"
        b64_content = base64.b64encode(binary_content).decode() + "\n"
        mock_run.return_value = MagicMock(returncode=0, stdout=b64_content, stderr="")

        result = sync.fetch_raw_binary("owner/repo", "main", "img.png")

        self.assertEqual(result, binary_content)
        cmd = mock_run.call_args[0][0]
        self.assertIn("--jq", cmd)
        self.assertIn(".content", cmd)
        self.assertNotIn("Accept: application/vnd.github.raw+json", " ".join(cmd))

    @patch("sync.subprocess.run")
    def test_returns_none_on_404(self, mock_run):
        mock_run.return_value = MagicMock(returncode=1, stdout="", stderr="404 Not Found")

        self.assertIsNone(sync.fetch_raw_binary("o/r", "main", "x.ttf"))

    @patch("sync.subprocess.run")
    def test_returns_none_on_empty_stdout(self, mock_run):
        mock_run.return_value = MagicMock(returncode=0, stdout="", stderr="")

        self.assertIsNone(sync.fetch_raw_binary("o/r", "main", "x.ttf"))

    @patch("sync.subprocess.run")
    def test_returns_none_on_invalid_base64(self, mock_run):
        mock_run.return_value = MagicMock(returncode=0, stdout="!!!not-base64!!!", stderr="")

        self.assertIsNone(sync.fetch_raw_binary("o/r", "main", "x.ttf"))

    @patch("sync.subprocess.run")
    def test_returns_none_on_non_404_error(self, mock_run):
        mock_run.return_value = MagicMock(returncode=1, stdout="", stderr="rate limit exceeded")

        self.assertIsNone(sync.fetch_raw_binary("o/r", "main", "x.ttf"))

class TestSyncSkillFiles(TempCatalogTestCase):
    def _call(self, tree, cached_entry, **kwargs):
        return sync.sync_skill_files(
            "owner/repo",
            "main",
            tree,
            "skills/",
            "demo",
            "SKILL.md",
            "demo",
            cached_entry,
            **kwargs,
        )

    @patch("sync.fetch_raw_file")
    def test_new_file_detection_safe_add(self, mock_fetch_raw):
        mock_fetch_raw.return_value = "upstream"
        cached = {"file_hashes": {}, "tree_shas": {}}
        tree = make_tree(**{"skills/demo/SKILL.md": "s", "skills/demo/new.md": "t"})

        classification, changes = self._call(tree, cached)

        self.assertEqual(classification, "safe")
        self.assertEqual(changes["files_added"], ["new.md"])
        self.assertEqual((self.catalog_root / "demo" / "new.md").read_text(), "upstream")

    @patch("sync.fetch_raw_file")
    def test_new_file_local_exists_and_matches_upstream_is_unchanged(self, mock_fetch_raw):
        skill_root = self.catalog_root / "demo"
        skill_root.mkdir(parents=True)
        (skill_root / "new.md").write_text("same")
        mock_fetch_raw.return_value = "same"

        cached = {"file_hashes": {}, "tree_shas": {}}
        tree = make_tree(**{"skills/demo/new.md": "t"})

        classification, changes = self._call(tree, cached)

        self.assertEqual(classification, "unchanged")
        self.assertEqual(changes["files_added"], [])
        self.assertEqual(changes["files_modified"], [])

    @patch("sync.fetch_raw_file")
    def test_new_file_local_exists_and_differs_is_review(self, mock_fetch_raw):
        skill_root = self.catalog_root / "demo"
        skill_root.mkdir(parents=True)
        (skill_root / "new.md").write_text("local")
        mock_fetch_raw.return_value = "upstream"

        cached = {"file_hashes": {}, "tree_shas": {}}
        tree = make_tree(**{"skills/demo/new.md": "t"})

        classification, changes = self._call(tree, cached)

        self.assertEqual(classification, "review")
        self.assertEqual(changes["files_modified"], ["new.md"])

    @patch("sync.fetch_raw_file")
    def test_modified_file_local_matches_cache_is_safe_overwrite(self, mock_fetch_raw):
        skill_root = self.catalog_root / "demo"
        skill_root.mkdir(parents=True)
        (skill_root / "doc.md").write_text("old")
        mock_fetch_raw.return_value = "new"

        cached = {
            "file_hashes": {"doc.md": sync.sha256("old")},
            "tree_shas": {"doc.md": "old-tree"},
        }
        tree = make_tree(**{"skills/demo/doc.md": "new-tree"})

        classification, changes = self._call(tree, cached)

        self.assertEqual(classification, "safe")
        self.assertEqual(changes["files_modified"], ["doc.md"])
        self.assertEqual((skill_root / "doc.md").read_text(), "new")

    @patch("sync.fetch_raw_file")
    def test_modified_file_local_differs_from_cache_is_review_no_overwrite(self, mock_fetch_raw):
        skill_root = self.catalog_root / "demo"
        skill_root.mkdir(parents=True)
        (skill_root / "doc.md").write_text("local-edited")
        mock_fetch_raw.return_value = "new"

        cached = {
            "file_hashes": {"doc.md": sync.sha256("old")},
            "tree_shas": {"doc.md": "old-tree"},
        }
        tree = make_tree(**{"skills/demo/doc.md": "new-tree"})

        classification, changes = self._call(tree, cached)

        self.assertEqual(classification, "review")
        self.assertEqual(changes["files_modified"], ["doc.md"])
        self.assertEqual((skill_root / "doc.md").read_text(), "local-edited")

    def test_deleted_file_local_matches_cache_is_safe_remove(self):
        skill_root = self.catalog_root / "demo"
        skill_root.mkdir(parents=True)
        stale = skill_root / "old.md"
        stale.write_text("old")

        cached = {
            "file_hashes": {"old.md": sync.sha256("old")},
            "tree_shas": {"old.md": "old-tree"},
        }
        tree = {}

        classification, changes = self._call(tree, cached)

        self.assertEqual(classification, "safe")
        self.assertEqual(changes["files_deleted"], ["old.md"])
        self.assertFalse(stale.exists())

    def test_deleted_file_local_differs_from_cache_is_review_no_remove(self):
        skill_root = self.catalog_root / "demo"
        skill_root.mkdir(parents=True)
        stale = skill_root / "old.md"
        stale.write_text("local-edited")

        cached = {
            "file_hashes": {"old.md": sync.sha256("old")},
            "tree_shas": {"old.md": "old-tree"},
        }
        tree = {}

        classification, changes = self._call(tree, cached)

        self.assertEqual(classification, "review")
        self.assertEqual(changes["files_deleted"], ["old.md"])
        self.assertTrue(stale.exists())

    @patch("sync.fetch_raw_binary")
    @patch("sync.fetch_raw_file")
    def test_unchanged_tree_sha_short_circuits_fetch(self, mock_fetch_raw, mock_fetch_raw_binary):
        cached = {
            "file_hashes": {"doc.md": sync.sha256("x")},
            "tree_shas": {"doc.md": "same-tree"},
        }
        tree = make_tree(**{"skills/demo/doc.md": "same-tree"})

        classification, _ = self._call(tree, cached)

        self.assertEqual(classification, "unchanged")
        mock_fetch_raw.assert_not_called()
        mock_fetch_raw_binary.assert_not_called()

    @patch("sync.fetch_raw_file")
    def test_init_mode_populates_cache_only_no_classification(self, mock_fetch_raw):
        mock_fetch_raw.return_value = "new-content"
        cached = {"file_hashes": {}, "tree_shas": {}}
        tree = make_tree(**{"skills/demo/doc.md": "tree1"})

        classification, changes = self._call(tree, cached, init=True)

        self.assertEqual(classification, "unchanged")
        self.assertEqual(changes["files_added"], [])
        self.assertIn("doc.md", cached["file_hashes"])
        self.assertIn("doc.md", cached["tree_shas"])
        self.assertFalse((self.catalog_root / "demo" / "doc.md").exists())

    @patch("sync.fetch_raw_file")
    def test_dry_run_mode_no_writes(self, mock_fetch_raw):
        mock_fetch_raw.return_value = "upstream"
        cached = {"file_hashes": {}, "tree_shas": {}}
        tree = make_tree(**{"skills/demo/new.md": "tree"})

        classification, changes = self._call(tree, cached, dry_run=True)

        self.assertEqual(classification, "safe")
        self.assertEqual(changes["files_added"], ["new.md"])
        self.assertFalse((self.catalog_root / "demo" / "new.md").exists())

    @patch("sync.fetch_raw_file")
    @patch("sync.fetch_raw_binary")
    def test_binary_file_handling_uses_fetch_raw_binary_and_write_bytes(
        self, mock_fetch_raw_binary, mock_fetch_raw
    ):
        mock_fetch_raw_binary.return_value = b"\x89PNG\r\n"
        cached = {"file_hashes": {}, "tree_shas": {}}
        tree = make_tree(**{"skills/demo/image.png": "tree"})

        classification, changes = self._call(tree, cached)

        self.assertEqual(classification, "safe")
        self.assertEqual(changes["files_added"], ["image.png"])
        self.assertEqual((self.catalog_root / "demo" / "image.png").read_bytes(), b"\x89PNG\r\n")
        mock_fetch_raw.assert_not_called()

    @patch("sync.fetch_raw_file")
    def test_upstream_path_parameter_uses_correct_prefix(self, mock_fetch_raw):
        mock_fetch_raw.return_value = "x"
        cached = {"file_hashes": {}, "tree_shas": {}}
        tree = make_tree(**{"alt/root/demo/rules.md": "tree"})

        sync.sync_skill_files(
            "owner/repo",
            "main",
            tree,
            "skills/",
            "ignored",
            "SKILL.md",
            "demo",
            cached,
            upstream_path="alt/root/demo/SKILL.md",
        )

        mock_fetch_raw.assert_called_once_with("owner/repo", "main", "alt/root/demo/rules.md")

    @patch("sync.fetch_raw_file")
    def test_skill_md_excluded_from_file_hashes(self, mock_fetch_raw):
        mock_fetch_raw.return_value = "content"
        cached = {"file_hashes": {}, "tree_shas": {}}
        tree = make_tree(
            **{
                "skills/demo/SKILL.md": "skill-tree",
                "skills/demo/rules.md": "rules-tree",
            }
        )

        self._call(tree, cached, init=True)

        self.assertNotIn("SKILL.md", cached["file_hashes"])
        self.assertNotIn("SKILL.md", cached["tree_shas"])
        self.assertIn("rules.md", cached["file_hashes"])

    @patch("sync.fetch_raw_file")
    def test_multiple_files_mixed_classification_overall_review(self, mock_fetch_raw):
        skill_root = self.catalog_root / "demo"
        skill_root.mkdir(parents=True)
        (skill_root / "b.md").write_text("local-edited")

        def side_effect(owner_repo, ref, path):
            if path.endswith("a.md"):
                return "new-a"
            if path.endswith("b.md"):
                return "new-b"
            return None

        mock_fetch_raw.side_effect = side_effect
        cached = {
            "file_hashes": {"b.md": sync.sha256("old-b")},
            "tree_shas": {"b.md": "b-old"},
        }
        tree = make_tree(**{"skills/demo/a.md": "a-tree", "skills/demo/b.md": "b-new"})

        classification, changes = self._call(tree, cached)

        self.assertEqual(classification, "review")
        self.assertIn("a.md", changes["files_added"])
        self.assertIn("b.md", changes["files_modified"])

    @patch("sync.fetch_raw_file")
    def test_all_safe_changes_overall_safe(self, mock_fetch_raw):
        skill_root = self.catalog_root / "demo"
        skill_root.mkdir(parents=True)
        (skill_root / "mod.md").write_text("old-mod")
        (skill_root / "del.md").write_text("old-del")

        def side_effect(owner_repo, ref, path):
            if path.endswith("add.md"):
                return "new-add"
            if path.endswith("mod.md"):
                return "new-mod"
            return None

        mock_fetch_raw.side_effect = side_effect
        cached = {
            "file_hashes": {
                "mod.md": sync.sha256("old-mod"),
                "del.md": sync.sha256("old-del"),
            },
            "tree_shas": {"mod.md": "old-mod-tree", "del.md": "old-del-tree"},
        }
        tree = make_tree(**{"skills/demo/add.md": "add-tree", "skills/demo/mod.md": "new-mod-tree"})

        classification, changes = self._call(tree, cached)

        self.assertEqual(classification, "safe")
        self.assertEqual(changes["files_added"], ["add.md"])
        self.assertEqual(changes["files_modified"], ["mod.md"])
        self.assertEqual(changes["files_deleted"], ["del.md"])

    @patch("sync.fetch_raw_file")
    def test_no_changes_overall_unchanged(self, mock_fetch_raw):
        cached = {
            "file_hashes": {"x.md": sync.sha256("x")},
            "tree_shas": {"x.md": "tree-x"},
        }
        tree = make_tree(**{"skills/demo/x.md": "tree-x"})

        classification, changes = self._call(tree, cached)

        self.assertEqual(classification, "unchanged")
        self.assertEqual(changes["files_added"], [])
        self.assertEqual(changes["files_modified"], [])
        self.assertEqual(changes["files_deleted"], [])
        mock_fetch_raw.assert_not_called()


class TestReportBuilding(unittest.TestCase):
    def test_build_pr_body_includes_file_level_details(self):
        report = make_report(
            safe=[
                {
                    "name": "demo",
                    "date": "12026-02-28",
                    "file_changes": {
                        "skill_md_changed": True,
                        "files_added": ["a.md"],
                        "files_modified": ["b.md"],
                        "files_deleted": ["c.md"],
                    },
                }
            ]
        )

        body = sync.build_pr_body("owner/repo", report)

        self.assertIn("Modified: `SKILL.md` body", body)
        self.assertIn("Added: `a.md`", body)
        self.assertIn("Modified: `b.md`", body)
        self.assertIn("Deleted: `c.md`", body)

    def test_build_issue_body_includes_review_file_details(self):
        all_reports = {
            "owner/repo": make_report(
                review=[
                    {
                        "name": "demo",
                        "date": "unknown",
                        "file_changes": {
                            "skill_md_changed": True,
                            "files_added": ["new.md"],
                            "files_modified": ["mod.md"],
                            "files_deleted": ["del.md"],
                        },
                    }
                ]
            )
        }

        body = sync.build_issue_body(all_reports)

        self.assertIn("SKILL.md body changed", body)
        self.assertIn("Added: `new.md`", body)
        self.assertIn("Modified: `mod.md` (local modifications detected)", body)
        self.assertIn("Deleted: `del.md`", body)

    def test_build_issue_body_includes_adapted_skill_file_changes(self):
        all_reports = {
            "owner/repo": make_report(
                adapted_changed=[
                    {
                        "name": "adapted-skill",
                        "section_diff": "Added: `## New`",
                        "url": "https://example/history",
                        "file_changes": {
                            "skill_md_changed": False,
                            "files_added": ["notes.md"],
                            "files_modified": ["rules.md"],
                            "files_deleted": ["old.md"],
                        },
                    }
                ]
            )
        }

        body = sync.build_issue_body(all_reports)

        self.assertIn("adapted-skill", body)
        self.assertIn("Added: `notes.md`", body)
        self.assertIn("Modified: `rules.md`", body)
        self.assertIn("Deleted: `old.md`", body)

    def test_build_issue_body_includes_new_skills_links(self):
        all_reports = {
            "owner/repo": make_report(
                new_skills=[
                    {
                        "dir": "new-skill",
                        "url": "https://github.com/owner/repo/tree/main/skills/new-skill",
                    }
                ]
            )
        }

        body = sync.build_issue_body(all_reports)

        self.assertIn(
            "- [`new-skill`](https://github.com/owner/repo/tree/main/skills/new-skill)",
            body,
        )

    def test_empty_file_changes_produces_no_file_detail_lines(self):
        all_reports = {
            "owner/repo": make_report(
                review=[
                    {
                        "name": "demo",
                        "date": "unknown",
                        "file_changes": {
                            "skill_md_changed": False,
                            "files_added": [],
                            "files_modified": [],
                            "files_deleted": [],
                        },
                    }
                ]
            )
        }

        body = sync.build_issue_body(all_reports)

        self.assertNotIn("  - Added:", body)
        self.assertNotIn("  - Modified:", body)
        self.assertNotIn("  - Deleted:", body)


class TestProcessRepo(TempCatalogTestCase):
    def _base_config(self):
        return {
            "ref": "main",
            "discover": {"root": "skills/", "skill_file": "SKILL.md"},
            "skills": {"demo": {"upstream_dir": "demo"}},
            "adapted_skills": {},
            "ignored": [],
        }

    def _upstream_skill(self, body):
        return (
            "---\nname: demo\nmetadata:\n  lastUpdated: \"12026-01-01\"\n---\n" + body
        )

    @patch("sync.sync_skill_files")
    @patch("sync.fetch_repo_tree")
    @patch("sync.fetch_raw_file")
    @patch("sync.fetch_last_commit_date")
    def test_combined_body_and_files_both_safe(
        self, mock_commit_date, mock_fetch_raw, _mock_tree, mock_sync_files
    ):
        skill_dir = self.catalog_root / "demo"
        skill_dir.mkdir(parents=True)
        (skill_dir / "SKILL.md").write_text(
            "---\nmetadata:\n  lastUpdated: \"12026-01-01\"\n---\nold-body"
        )

        mock_fetch_raw.return_value = self._upstream_skill("new-body")
        mock_commit_date.return_value = "2026-02-01T00:00:00Z"
        mock_sync_files.return_value = (
            "safe",
            {"skill_md_changed": False, "files_added": [], "files_modified": [], "files_deleted": []},
        )

        cache = make_cache(
            skills={"demo": {"upstream_body_sha256": sync.sha256("old-body")}}
        )
        report = sync.process_repo("owner/repo", self._base_config(), cache, dry_run=True)

        self.assertEqual(len(report["safe"]), 1)
        self.assertEqual(len(report["review"]), 0)

    @patch("sync.sync_skill_files")
    @patch("sync.fetch_repo_tree")
    @patch("sync.fetch_raw_file")
    @patch("sync.fetch_last_commit_date")
    def test_combined_body_safe_files_review_overall_review(
        self, mock_commit_date, mock_fetch_raw, _mock_tree, mock_sync_files
    ):
        skill_dir = self.catalog_root / "demo"
        skill_dir.mkdir(parents=True)
        (skill_dir / "SKILL.md").write_text(
            "---\nmetadata:\n  lastUpdated: \"12026-01-01\"\n---\nold-body"
        )

        mock_fetch_raw.return_value = self._upstream_skill("new-body")
        mock_commit_date.return_value = "2026-02-01T00:00:00Z"
        mock_sync_files.return_value = (
            "review",
            {"skill_md_changed": False, "files_added": [], "files_modified": ["x.md"], "files_deleted": []},
        )

        cache = make_cache(
            skills={"demo": {"upstream_body_sha256": sync.sha256("old-body")}}
        )
        report = sync.process_repo("owner/repo", self._base_config(), cache, dry_run=True)

        self.assertEqual(len(report["safe"]), 0)
        self.assertEqual(len(report["review"]), 1)

    @patch("sync.sync_skill_files")
    @patch("sync.fetch_repo_tree")
    @patch("sync.fetch_raw_file")
    @patch("sync.fetch_last_commit_date")
    def test_combined_body_review_files_safe_overall_review(
        self, mock_commit_date, mock_fetch_raw, _mock_tree, mock_sync_files
    ):
        skill_dir = self.catalog_root / "demo"
        skill_dir.mkdir(parents=True)
        (skill_dir / "SKILL.md").write_text(
            "---\nmetadata:\n  lastUpdated: \"12026-01-01\"\n---\nlocal-edited"
        )

        mock_fetch_raw.return_value = self._upstream_skill("new-body")
        mock_commit_date.return_value = "2026-02-01T00:00:00Z"
        mock_sync_files.return_value = (
            "safe",
            {"skill_md_changed": False, "files_added": ["x.md"], "files_modified": [], "files_deleted": []},
        )

        cache = make_cache(
            skills={"demo": {"upstream_body_sha256": sync.sha256("old-body")}}
        )
        report = sync.process_repo("owner/repo", self._base_config(), cache, dry_run=True)

        self.assertEqual(len(report["safe"]), 0)
        self.assertEqual(len(report["review"]), 1)

    @patch("sync.fetch_repo_tree")
    @patch("sync.fetch_raw_file")
    def test_init_mode_populates_body_hash_and_file_hashes(self, mock_fetch_raw, mock_tree):
        config = self._base_config()
        cache = make_cache()
        mock_tree.return_value = {
            "skills/demo/SKILL.md": "skill-tree",
            "skills/demo/rules.md": "rules-tree",
        }

        def side_effect(owner_repo, ref, path):
            if path.endswith("SKILL.md"):
                return self._upstream_skill("upstream-body")
            if path.endswith("rules.md"):
                return "rules-content"
            return None

        mock_fetch_raw.side_effect = side_effect

        report = sync.process_repo("owner/repo", config, cache, init=True, dry_run=True)

        self.assertEqual(report["safe"], [])
        entry = cache["skills"]["demo"]
        self.assertEqual(entry["upstream_body_sha256"], sync.sha256("upstream-body"))
        self.assertIn("rules.md", entry["file_hashes"])
        self.assertIn("rules.md", entry["tree_shas"])

    @patch("sync.fetch_repo_tree")
    @patch("sync.fetch_raw_file")
    @patch("sync.sync_skill_files")
    def test_adapted_skills_use_dry_run_true_for_file_sync(
        self, mock_sync_files, mock_fetch_raw, mock_tree
    ):
        config = {
            "ref": "main",
            "discover": {"root": "skills/", "skill_file": "SKILL.md"},
            "skills": {},
            "adapted_skills": {"adapted": {"upstream_dir": "adapted"}},
            "ignored": [],
        }
        mock_tree.return_value = {}
        mock_fetch_raw.return_value = self._upstream_skill("adapted-body")
        mock_sync_files.return_value = (
            "unchanged",
            {"skill_md_changed": False, "files_added": [], "files_modified": [], "files_deleted": []},
        )

        sync.process_repo("owner/repo", config, make_cache(), dry_run=False)

        self.assertTrue(mock_sync_files.called)
        _, kwargs = mock_sync_files.call_args
        self.assertTrue(kwargs["dry_run"])


class TestCreatePrForRepo(unittest.TestCase):
    @patch("sync.subprocess.run")
    @patch("sync.git")
    def test_stages_added_modified_deleted_and_skill_md(self, mock_git, mock_subproc):
        mock_git.return_value = _cp_ok()
        mock_subproc.side_effect = [_cp_ok("[]"), _cp_ok("https://example/pr")]

        report = make_report(
            safe=[
                {
                    "name": "demo",
                    "date": "12026-02-28",
                    "file_changes": {
                        "skill_md_changed": True,
                        "files_added": ["a.md"],
                        "files_modified": ["b.md"],
                        "files_deleted": ["c.md"],
                    },
                }
            ]
        )

        sync.create_pr_for_repo("owner/repo", report, dry_run=False)

        calls = mock_git.call_args_list
        self.assertIn(call("add", "catalog/skills/demo/SKILL.md"), calls)
        self.assertIn(call("add", "catalog/skills/demo/a.md"), calls)
        self.assertIn(call("add", "catalog/skills/demo/b.md"), calls)
        self.assertIn(call("rm", "catalog/skills/demo/c.md", check=False), calls)


class TestDiffMode(TempCatalogTestCase):
    def _capture(self, *args, **kwargs):
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            sync._print_skill_diff(*args, **kwargs)
        return buf.getvalue()

    @patch("sync.fetch_raw_file")
    def test_print_skill_diff_shows_file_level_diffs(self, mock_fetch_raw):
        skill_root = self.catalog_root / "demo"
        (skill_root / "rules").mkdir(parents=True)
        (skill_root / "SKILL.md").write_text("---\nname: demo\n---\nlocal-body")
        (skill_root / "rules" / "a.md").write_text("local-rule")

        tree = {
            "skills/demo/SKILL.md": "sha-skill",
            "skills/demo/rules/a.md": "sha-rule",
        }

        def side_effect(owner_repo, ref, path):
            if path.endswith("SKILL.md"):
                return "---\nname: demo\n---\nupstream-body"
            if path.endswith("rules/a.md"):
                return "upstream-rule"
            return None

        mock_fetch_raw.side_effect = side_effect

        out = self._capture(
            "owner/repo",
            "main",
            tree,
            "skills/demo/SKILL.md",
            "demo",
            "ported",
            "SKILL.md",
        )

        self.assertIn("File diff: `rules/a.md`", out)

    @patch("sync.fetch_raw_file")
    def test_print_skill_diff_binary_file_message(self, mock_fetch_raw):
        skill_root = self.catalog_root / "demo"
        skill_root.mkdir(parents=True)
        (skill_root / "SKILL.md").write_text("---\nname: demo\n---\nbody")
        (skill_root / "image.png").write_bytes(b"\x89PNG")

        tree = {
            "skills/demo/SKILL.md": "sha-skill",
            "skills/demo/image.png": "sha-img",
        }
        mock_fetch_raw.return_value = "---\nname: demo\n---\nbody"

        out = self._capture(
            "owner/repo",
            "main",
            tree,
            "skills/demo/SKILL.md",
            "demo",
            "ported",
            "SKILL.md",
        )

        self.assertIn("Binary file (diff skipped): `image.png`", out)

    @patch("sync.fetch_raw_file")
    def test_print_skill_diff_new_upstream_file_message(self, mock_fetch_raw):
        skill_root = self.catalog_root / "demo"
        skill_root.mkdir(parents=True)
        (skill_root / "SKILL.md").write_text("---\nname: demo\n---\nbody")

        tree = {
            "skills/demo/SKILL.md": "sha-skill",
            "skills/demo/new.md": "sha-new",
        }

        def side_effect(owner_repo, ref, path):
            if path.endswith("SKILL.md"):
                return "---\nname: demo\n---\nbody"
            if path.endswith("new.md"):
                return "new"
            return None

        mock_fetch_raw.side_effect = side_effect

        out = self._capture(
            "owner/repo",
            "main",
            tree,
            "skills/demo/SKILL.md",
            "demo",
            "ported",
            "SKILL.md",
        )

        self.assertIn("New upstream file: `new.md`", out)

    @patch("sync.fetch_raw_file")
    def test_print_skill_diff_deleted_upstream_message(self, mock_fetch_raw):
        skill_root = self.catalog_root / "demo"
        skill_root.mkdir(parents=True)
        (skill_root / "SKILL.md").write_text("---\nname: demo\n---\nbody")
        (skill_root / "old.md").write_text("local")
        tree = {"skills/demo/SKILL.md": "sha-skill"}
        mock_fetch_raw.return_value = "---\nname: demo\n---\nbody"

        out = self._capture(
            "owner/repo",
            "main",
            tree,
            "skills/demo/SKILL.md",
            "demo",
            "ported",
            "SKILL.md",
        )

        self.assertIn("Deleted upstream: `old.md`", out)


if __name__ == "__main__":
    unittest.main()
