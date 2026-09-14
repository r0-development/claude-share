import unittest
from cs import manifest as mf
from cs.config import Machine

TOML = """
schema_version = 1
[workspace]
root = "~/dev"
[identities.work]
name = "W"
email = "w@x"
owner = "acme"
[projects.a]
kind = "git"
url = "git@github.com:acme/a.git"
identity = "work"
profiles = ["work"]
[projects.b]
kind = "synced"
profiles = ["all"]
[projects.c]
kind = "local"
machines = ["m1"]
"""


class ManifestTests(unittest.TestCase):
    def setUp(self):
        self.m = mf.parse(TOML)

    def test_parse_and_validate(self):
        self.assertEqual(self.m.validate(), [])
        self.assertEqual(set(self.m.projects), {"a", "b", "c"})

    def test_selection(self):
        sel = {p.name for p in self.m.selected(Machine("m1", ["work"]))}
        self.assertEqual(sel, {"a", "b", "c"})
        sel = {p.name for p in self.m.selected(Machine("m2", ["personal"], exclude=["b"]))}
        self.assertEqual(sel, set())

    def test_identity_glob(self):
        self.assertEqual(self.m.identity_for_url("git@github.com:acme/zzz.git").id, "work")
        self.assertIsNone(self.m.identity_for_url("git@github.com:other/zzz.git"))

    def test_validation_errors(self):
        bad = mf.parse(TOML + "\n[projects.d]\nkind='git'\nurl='git@github.com:other/d.git'\nidentity='work'\n")
        self.assertTrue(any("does not match identity" in e for e in bad.validate()))

    def test_project_block_roundtrip(self):
        self.assertEqual(self.m.identities["work"].globs, ["git@github.com:acme/**"])
        p = mf.Project(name="x", kind="git", url="git@github.com:acme/x.git", identity="work", profiles=["work"], layout="worktrees")
        block = mf.project_block(p)
        again = mf.parse(TOML + "\n" + block).projects["x"]
        self.assertEqual((again.url, again.identity, again.layout, again.profiles), (p.url, p.identity, "worktrees", ["work"]))


if __name__ == "__main__":
    unittest.main()
