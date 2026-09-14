import unittest
from cs import master


class UrlTests(unittest.TestCase):
    def test_github_forms(self):
        for u in ["https://github.com/o/r", "https://github.com/o/r.git", "https://github.com/o/r/", "github.com/o/r",
                  "git@github.com:o/r", "git@github.com:o/r.git", "ssh://git@github.com/o/r.git", "https://www.github.com/o/r"]:
            self.assertEqual(master.parse_repo_url(u), ("git@github.com:o/r.git", ("o", "r")), u)

    def test_other_host_kept(self):
        self.assertEqual(master.parse_repo_url("git@gitea.local:me/cfg.git"), ("git@gitea.local:me/cfg.git", None))


if __name__ == "__main__":
    unittest.main()
