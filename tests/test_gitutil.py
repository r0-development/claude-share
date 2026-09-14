import unittest
from cs import gitutil


class CanonicalTests(unittest.TestCase):
    def test_forms_collapse(self):
        want = "git@github.com:org/repo.git"
        for u in ["git@github.com:org/repo", "git@github-personal:org/repo.git", "https://github.com/org/repo",
                  "ssh://git@github.com/org/repo.git"]:
            self.assertEqual(gitutil.canonical_github(u), want, u)


if __name__ == "__main__":
    unittest.main()
