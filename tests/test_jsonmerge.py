import unittest
from cs import jsonmerge as jm


class MergeTests(unittest.TestCase):
    def test_dicts_merge_recursively(self):
        self.assertEqual(jm.merge_layers({"a": {"x": 1}}, {"a": {"y": 2}}), {"a": {"x": 1, "y": 2}})

    def test_scalar_overlay_wins(self):
        self.assertEqual(jm.merge_layers({"model": "opus"}, {"model": "sonnet"}), {"model": "sonnet"})

    def test_plain_lists_replaced(self):
        self.assertEqual(jm.merge_layers({"l": [1, 2]}, {"l": [3]}), {"l": [3]})

    def test_permission_lists_unioned(self):
        base = {"permissions": {"allow": ["A", "B"]}}
        over = {"permissions": {"allow": ["B", "C"]}}
        self.assertEqual(jm.merge_layers(base, over)["permissions"]["allow"], ["A", "B", "C"])

    def test_three_layers(self):
        out = jm.merge_layers({"a": 1}, {"b": 2}, {"a": 3})
        self.assertEqual(out, {"a": 3, "b": 2})

    def test_diff_keys(self):
        self.assertEqual(jm.diff_keys({"a": {"x": 1}, "b": 1}, {"a": {"x": 2}, "c": 1}), ["a.x", "b", "c"])


if __name__ == "__main__":
    unittest.main()
