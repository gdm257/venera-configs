#!/usr/bin/env python3
"""
Venera Source Validator - Validate Venera source configuration files
"""

import ast
import json
import re
import sys
from pathlib import Path


class SourceValidator:
    """Validate Venera source configuration files"""

    REQUIRED_METHODS = {
        "name": "string",
        "key": "string",
        "version": "string",
        "minAppVersion": "string",
        "url": "string",
    }

    COMMON_METHODS = [
        "explore",
        "category",
        "search",
        "comic.loadInfo",
        "comic.loadEp",
        "account",
        "favorites",
        "history",
        "comic.loadComments",
        "comment.loadReply",
        "optionList",
        "optionLoader",
        "onImageLoad",
        "onThumbnailLoad",
    ]

    def __init__(self, file_path):
        self.file_path = Path(file_path)
        self.content = ""
        self.ast_tree = None
        self.errors = []
        self.warnings = []
        self.info = []

    def load_file(self):
        """Load and parse the source file"""
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                self.content = f.read()
            return True
        except Exception as e:
            self.errors.append(f"Failed to read file: {e}")
            return False

    def parse_ast(self):
        """Parse JavaScript file using AST"""
        try:
            # Simple regex-based parsing for JavaScript
            # In a real implementation, use a proper JS parser
            self.extract_class_info()
            return True
        except Exception as e:
            self.errors.append(f"Failed to parse file: {e}")
            return False

    def extract_class_info(self):
        """Extract class and method information from source file"""
        # Extract class definition
        class_match = re.search(r"class\s+(\w+)\s+extends\s+ComicSource", self.content)
        if not class_match:
            self.errors.append("No class extending ComicSource found")
            return

        self.info.append(f"Class name: {class_match.group(1)}")

        # Extract methods
        method_pattern = r"(?:async\s+)?(\w+(?:\.\w+)?)\s*\([^)]*\)\s*{"
        methods = re.findall(method_pattern, self.content)

        self.info.append(f"Found {len(methods)} methods: {', '.join(methods)}")

        # Check for required methods
        for method in self.REQUIRED_METHODS:
            if method not in methods:
                self.errors.append(f"Missing required method: {method}")

        # Check for common methods
        for method in self.COMMON_METHODS:
            if method in methods:
                self.info.append(f"Found common method: {method}")

    def check_syntax(self):
        """Check for common syntax issues"""
        # Check for proper imports
        if "import" in self.content and "./_venera_.js" not in self.content:
            self.warnings.append(
                "Consider adding type import: /** @type {import('./_venera_.js')} */"
            )

        # Check for Network API usage
        if "Network." not in self.content:
            self.warnings.append(
                "No Network API usage found - source may not make HTTP requests"
            )

        # Check for Comic class usage
        if "new Comic(" not in self.content:
            self.warnings.append("No Comic object creation found - check data parsing")

        # Check for error handling
        if "try" not in self.content or "catch" not in self.content:
            self.warnings.append("Consider adding try-catch blocks for error handling")

    def check_metadata(self):
        """Check metadata properties"""
        # Check for proper version format
        version_match = re.search(r"version\s*:\s*['\"]([^'\"]+)['\"]", self.content)
        if version_match:
            version = version_match.group(1)
            if not re.match(r"^\d+\.\d+\.\d+$", version):
                self.warnings.append(f"Version should follow semver format: {version}")

        # Check URL format
        url_match = re.search(r"url\s*:\s*['\"]([^'\"]+)['\"]", self.content)
        if url_match:
            url = url_match.group(1)
            if not url.startswith(("http://", "https://")):
                self.errors.append(f"Invalid URL format: {url}")

    def validate(self):
        """Run all validation checks"""
        if not self.load_file():
            return False

        if not self.parse_ast():
            return False

        self.check_syntax()
        self.check_metadata()

        return len(self.errors) == 0

    def print_report(self):
        """Print validation report"""
        print(f"Validation Report for: {self.file_path}")
        print("=" * 50)

        if self.errors:
            print("ERRORS:")
            for error in self.errors:
                print(f"  - {error}")
            print()

        if self.warnings:
            print("WARNINGS:")
            for warning in self.warnings:
                print(f"  - {warning}")
            print()

        if self.info:
            print("INFO:")
            for info in self.info:
                print(f"  - {info}")
            print()

        if not self.errors:
            print("Validation passed!")
            return True
        else:
            print(f"Validation failed with {len(self.errors)} error(s)")
            return False


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Validate Venera source configuration")
    parser.add_argument("source_file", help="Path to source file to validate")
    parser.add_argument("--json", action="store_true", help="Output in JSON format")

    args = parser.parse_args()

    if not Path(args.source_file).exists():
        print(f"Error: File not found: {args.source_file}")
        sys.exit(1)

    validator = SourceValidator(args.source_file)
    is_valid = validator.validate()

    if args.json:
        report = {
            "file": args.source_file,
            "valid": is_valid,
            "errors": validator.errors,
            "warnings": validator.warnings,
            "info": validator.info,
        }
        print(json.dumps(report, indent=2))
    else:
        validator.print_report()

    sys.exit(0 if is_valid else 1)


if __name__ == "__main__":
    main()
