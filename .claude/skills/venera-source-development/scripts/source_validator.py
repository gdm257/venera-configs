#!/usr/bin/env python3
"""
Venera Source Validator

Validates Venera comic source files for common issues.

Usage:
    python source_validator.py <source_file.js>
"""

import sys
import re
import json
from pathlib import Path


class SourceValidator:
    REQUIRED_PROPERTIES = ['name', 'key', 'version', 'minAppVersion', 'url']
    REQUIRED_METHODS = ['getPopular', 'getLatest', 'search', 'loadInfo', 'loadEp']

    def __init__(self, source_code: str, filename: str = "unknown.js"):
        self.source_code = source_code
        self.filename = filename
        self.errors = []
        self.warnings = []
        self.info = []

    def validate(self) -> dict:
        """Run all validations and return results."""
        self._check_class_declaration()
        self._check_properties()
        self._check_methods()
        self._check_syntax_patterns()
        self._check_security()
        self._check_best_practices()

        return {
            'valid': len(self.errors) == 0,
            'errors': self.errors,
            'warnings': self.warnings,
            'info': self.info,
            'filename': self.filename
        }

    def _check_class_declaration(self):
        """Check class extends ComicSource."""
        if 'extends ComicSource' not in self.source_code:
            self.errors.append("Class must extend ComicSource")
        else:
            self.info.append("✓ Class extends ComicSource")

    def _check_properties(self):
        """Check required properties."""
        for prop in self.REQUIRED_PROPERTIES:
            # Match property declarations
            patterns = [
                rf'{prop}\s*=',
                rf'get\s+{prop}\s*\(',
                rf'set\s+{prop}\s*\('
            ]
            found = any(re.search(p, self.source_code) for p in patterns)

            if not found:
                self.errors.append(f"Missing required property: {prop}")
            else:
                self.info.append(f"✓ Property '{prop}' found")

    def _check_methods(self):
        """Check required methods."""
        for method in self.REQUIRED_METHODS:
            pattern = rf'\s+{method}\s*\('
            if not re.search(pattern, self.source_code):
                self.errors.append(f"Missing required method: {method}")
            else:
                self.info.append(f"✓ Method '{method}' found")

    def _check_syntax_patterns(self):
        """Check for common syntax issues."""
        # Check for async/await usage
        if 'async ' in self.source_code and 'await ' not in self.source_code:
            self.warnings.append("Async function without await detected")

        # Check for Network usage
        if 'Network.' in self.source_code:
            self.info.append("✓ Uses Network API")
        else:
            self.warnings.append("No Network API usage found")

        # Check for JSON parsing
        if 'JSON.parse' in self.source_code:
            self.info.append("✓ Parses JSON responses")

        # Check for HtmlDocument usage
        if 'new HtmlDocument' in self.source_code:
            self.info.append("✓ Uses HTML parsing")

    def _check_security(self):
        """Check for security issues."""
        # Check for eval usage
        if 'eval(' in self.source_code:
            self.errors.append("SECURITY: eval() is not allowed")

        # Check for Function constructor
        if 'new Function(' in self.source_code:
            self.errors.append("SECURITY: Function constructor is not allowed")

        # Check for document.write
        if 'document.write' in self.source_code:
            self.warnings.append("document.write is not recommended")

    def _check_best_practices(self):
        """Check for best practice recommendations."""
        # Check for error handling
        if 'try {' in self.source_code:
            self.info.append("✓ Uses try-catch for error handling")
        else:
            self.warnings.append("Consider adding error handling with try-catch")

        # Check for URL encoding
        if 'encodeURIComponent' in self.source_code:
            self.info.append("✓ URL-encodes parameters")
        else:
            self.warnings.append("Consider URL-encoding query parameters")

        # Check for timeout handling (if app supports it)
        if 'timeout' in self.source_code:
            self.info.append("✓ Handles request timeouts")


def main():
    if len(sys.argv) < 2:
        print("Usage: python source_validator.py <source_file.js>")
        sys.exit(1)

    source_file = Path(sys.argv[1])

    if not source_file.exists():
        print(f"Error: File not found: {source_file}")
        sys.exit(1)

    source_code = source_file.read_text(encoding='utf-8')

    validator = SourceValidator(source_code, source_file.name)
    result = validator.validate()

    print(f"\n{'=' * 60}")
    print(f"Validation Results: {result['filename']}")
    print(f"{'=' * 60}\n")

    if result['errors']:
        print(f"❌ ERRORS ({len(result['errors'])}):")
        for error in result['errors']:
            print(f"   • {error}")
        print()

    if result['warnings']:
        print(f"⚠️  WARNINGS ({len(result['warnings'])}):")
        for warning in result['warnings']:
            print(f"   • {warning}")
        print()

    if result['info']:
        print(f"✓ INFO ({len(result['info'])}):")
        for info in result['info']:
            print(f"   {info}")
        print()

    print(f"{'=' * 60}")
    if result['valid']:
        print("✅ Source is VALID")
    else:
        print("❌ Source has ERRORS - please fix before using")
    print(f"{'=' * 60}\n")

    sys.exit(0 if result['valid'] else 1)


if __name__ == '__main__':
    main()
