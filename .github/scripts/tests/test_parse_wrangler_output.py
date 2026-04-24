#!/usr/bin/env python3
"""test_parse_wrangler_output.py
Purpose: Verify parse_wrangler_output.py against captured Wrangler fixtures.
Run with: python3 -m pytest .github/scripts/tests/test_parse_wrangler_output.py -v
"""

import json
import pathlib
import sys
import unittest

SCRIPT_DIR = pathlib.Path(__file__).resolve().parents[1]
REPO_ROOT = SCRIPT_DIR.parents[1]
FIXTURE_ROOT = REPO_ROOT / ".github" / "tests" / "wrangler-output-fixtures"

sys.path.insert(0, str(SCRIPT_DIR))

import parse_wrangler_output as parser  # noqa: E402


def read_fixture_text(path):
    return path.read_text(encoding="utf-8", errors="replace")


class ParseWranglerOutputTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        manifest_path = FIXTURE_ROOT / "manifest.json"
        cls.manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        cls.fixtures = {fixture["id"]: fixture for fixture in cls.manifest["fixtures"]}

    def load_fixture(self, fixture_id):
        fixture = self.fixtures[fixture_id]
        stdout_text = read_fixture_text(FIXTURE_ROOT / fixture["stdout"])
        stderr_text = read_fixture_text(FIXTURE_ROOT / fixture["stderr"])
        return fixture, stdout_text, stderr_text

    def test_manifest_matrix_classifies_as_expected(self):
        for fixture_id, fixture in self.fixtures.items():
            with self.subTest(fixture_id=fixture_id):
                _, stdout_text, stderr_text = self.load_fixture(fixture_id)
                result = parser.classify_output(stdout_text, stderr_text)
                self.assertEqual(fixture["expected_classification"], result["classification"])

    def test_clean_controls_stay_clean(self):
        for fixture_id in ("4.36.0-clean", "4.84.1-clean"):
            with self.subTest(fixture_id=fixture_id):
                _, stdout_text, stderr_text = self.load_fixture(fixture_id)
                result = parser.classify_output(stdout_text, stderr_text)
                self.assertEqual("clean", result["classification"])
                self.assertEqual([], result["matches"])

    def test_rule_patterns_have_positive_and_negative_fixture_proof(self):
        evidence_pairs = [
            ("unknown_top_level_key", "unexpected_top_level_field", "4.36.0-unknown-top-level-key", "4.36.0-clean"),
            ("unknown_top_level_key", "unexpected_top_level_field", "4.35.0-ratelimits-historical", "4.36.0-clean"),
            ("missing_config", "could_not_read_file", "4.36.0-missing-config", "4.36.0-clean"),
            ("missing_config", "enoent", "4.84.1-missing-config", "4.84.1-clean"),
            ("missing_entry_point", "missing_entry_point", "4.84.1-missing-entry-point", "4.84.1-clean"),
            ("npm_layer_error", "no_matching_version", "npm-9999.0.0", "4.84.1-clean"),
        ]

        for rule_name, pattern_name, positive_fixture_id, negative_fixture_id in evidence_pairs:
            with self.subTest(rule=rule_name, pattern=pattern_name, positive=positive_fixture_id, negative=negative_fixture_id):
                rule = parser.RULES_BY_NAME[rule_name]
                pattern = next(spec for spec in rule.patterns if spec.name == pattern_name)

                _, pos_stdout, pos_stderr = self.load_fixture(positive_fixture_id)
                positive_match = parser.find_pattern_match(pattern, parser.build_channels(pos_stdout, pos_stderr))
                self.assertIsNotNone(positive_match)

                _, neg_stdout, neg_stderr = self.load_fixture(negative_fixture_id)
                negative_match = parser.find_pattern_match(pattern, parser.build_channels(neg_stdout, neg_stderr))
                self.assertIsNone(negative_match)


if __name__ == "__main__":
    unittest.main()
