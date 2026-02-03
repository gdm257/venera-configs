#!/usr/bin/env python3
"""
Venera API Endpoint Fixer - Detect and fix broken API endpoints in source configurations
"""

import argparse
import re
import sys
from pathlib import Path
from urllib.parse import urlparse, urljoin


class APIFixer:
    """Fix API endpoint issues in Venera source files"""

    def __init__(self, file_path):
        self.file_path = Path(file_path)
        self.content = ""
        self.changes = []
        self.fixes_applied = 0

    def load_file(self):
        """Load source file"""
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                self.content = f.read()
            return True
        except Exception as e:
            print(f"Error loading file: {e}")
            return False

    def save_file(self, output_path=None):
        """Save modified file"""
        if output_path:
            save_path = Path(output_path)
        else:
            save_path = self.file_path

        try:
            save_path.parent.mkdir(parents=True, exist_ok=True)
            with open(save_path, "w", encoding="utf-8") as f:
                f.write(self.content)
            return True
        except Exception as e:
            print(f"Error saving file: {e}")
            return False

    def find_api_endpoints(self):
        """Find all API endpoint URLs in the file"""
        # Patterns for common endpoint formats
        patterns = [
            r"['\"](https?://[^'\"]+?/api/[^'\"]+?)['\"]",
            r"['\"](https?://[^'\"]+?/v\d+/[^'\"]+?)['\"]",
            r"['\"](https?://[^'\"]+?/graphql)['\"]",
            r"Network\.(?:get|post|delete)\s*\(\s*['\"]([^'\"]+?)['\"]",
            r"`\$\{this\.url\}([^`]+?)`",
        ]

        endpoints = []
        for pattern in patterns:
            matches = re.finditer(pattern, self.content)
            for match in matches:
                url = match.group(1) if match.groups() else match.group(0)
                endpoints.append(
                    {
                        "url": url,
                        "start": match.start(),
                        "end": match.end(),
                        "pattern": pattern,
                    }
                )

        return endpoints

    def analyze_endpoint(self, endpoint, base_url):
        """Analyze an endpoint for common issues"""
        issues = []
        suggestions = []

        url = endpoint["url"]

        # Check if URL is relative
        if url.startswith("/"):
            suggestions.append(f"Consider using template literal: `${{this.url}}{url}`")

        # Check for common broken patterns
        if "/api/v1/" in url and "/api/v2/" not in url:
            issues.append("Using v1 API, check if v2 is available")

        if "http://" in url:
            issues.append("Using HTTP instead of HTTPS")
            suggestions.append(url.replace("http://", "https://"))

        # Check for deprecated endpoints
        deprecated_patterns = [
            ("/old/", "/new/"),
            ("/v1/", "/v2/"),
            ("/api/", "/graphql/"),
        ]

        for old, new in deprecated_patterns:
            if old in url:
                new_url = url.replace(old, new)
                suggestions.append(new_url)

        return issues, suggestions

    def fix_common_issues(self):
        """Apply common fixes to API endpoints"""
        original_content = self.content

        # Fix 1: Replace HTTP with HTTPS
        self.content = re.sub(r"['\"]http://", "'https://", self.content)

        # Fix 2: Add proper template literals for relative URLs
        base_url_pattern = r"url\s*:\s*['\"]([^'\"]+)['\"]"
        base_match = re.search(base_url_pattern, self.content)
        if base_match:
            base_url = base_match.group(1)
            # Find relative URLs in Network calls
            relative_pattern = r"Network\.\w+\s*\(\s*['\"]/([^'\"]+)['\"]"
            matches = list(re.finditer(relative_pattern, self.content))
            for match in reversed(matches):
                rel_path = match.group(1)
                replacement = f"Network.get(`${{this.url}}/{rel_path}`"
                self.content = (
                    self.content[: match.start()]
                    + replacement
                    + self.content[match.end() :]
                )
                self.changes.append(f"Fixed relative URL: /{rel_path}")
                self.fixes_applied += 1

        # Fix 3: Update common deprecated endpoints
        replacements = [
            ("/api/v1/", "/api/v2/"),
            ("/old-api/", "/api/"),
            ("/manga/", "/comics/"),
        ]

        for old, new in replacements:
            if old in self.content:
                old_count = self.content.count(old)
                self.content = self.content.replace(old, new)
                self.changes.append(f"Updated {old} to {new} ({old_count} occurrences)")
                self.fixes_applied += old_count

        return self.content != original_content

    def add_error_handling(self):
        """Add error handling to Network calls"""
        # Pattern for Network calls without try-catch
        network_pattern = r"(async\s+)?(\w+)\s*=\s*await\s+Network\.(\w+)\s*\(([^)]+)\)"

        def add_try_catch(match):
            async_prefix = match.group(1) or ""
            var_name = match.group(2)
            method = match.group(3)
            args = match.group(4)

            # Skip if already in try-catch
            context = self.content[max(0, match.start() - 100) : match.end()]
            if "try" in context and "catch" in context:
                return match.group(0)

            self.fixes_applied += 1
            return f"""try {{
    {async_prefix}{var_name} = await Network.{method}({args});
}} catch (error) {{
    throw new Error(`Failed to fetch data: ${{error.message}}`);
}}"""

        new_content = re.sub(network_pattern, add_try_catch, self.content)

        if new_content != self.content:
            self.changes.append("Added error handling to Network calls")
            self.content = new_content
            return True

        return False

    def run(self, output_path=None, test_endpoints=False):
        """Run all fixes"""
        if not self.load_file():
            return False

        print(f"Analyzing: {self.file_path}")
        print("=" * 50)

        # Find and analyze endpoints
        endpoints = self.find_api_endpoints()
        print(f"Found {len(endpoints)} API endpoints")

        for i, endpoint in enumerate(endpoints, 1):
            print(f"\nEndpoint {i}: {endpoint['url'][:80]}...")

            # Get base URL from source
            base_match = re.search(r"url\s*:\s*['\"]([^'\"]+)['\"]", self.content)
            base_url = base_match.group(1) if base_match else ""

            issues, suggestions = self.analyze_endpoint(endpoint, base_url)

            if issues:
                print(f"  Issues: {', '.join(issues)}")
            if suggestions:
                print(f"  Suggestions: {', '.join(suggestions[:3])}")

        # Apply fixes
        print("\n" + "=" * 50)
        print("Applying fixes...")

        changed = False

        if self.fix_common_issues():
            changed = True

        if self.add_error_handling():
            changed = True

        # Print changes
        if self.changes:
            print("\nChanges applied:")
            for change in self.changes:
                print(f"  ✓ {change}")
        else:
            print("No changes needed")

        print(f"\nTotal fixes applied: {self.fixes_applied}")

        # Save if changes were made
        if changed and output_path:
            if self.save_file(output_path):
                print(f"\nSaved fixed file to: {output_path}")
            else:
                print("Failed to save file")
                return False
        elif changed:
            # Ask for confirmation before overwriting
            response = input("\nOverwrite original file? (y/N): ").strip().lower()
            if response == "y":
                if self.save_file():
                    print("File updated successfully")
                else:
                    print("Failed to save file")
                    return False
            else:
                print("Changes not saved")

        return True


def main():
    parser = argparse.ArgumentParser(
        description="Fix API endpoints in Venera source files"
    )
    parser.add_argument("--input", required=True, help="Input source file")
    parser.add_argument("--output", help="Output file path (optional)")
    parser.add_argument(
        "--test-endpoints", action="store_true", help="Test endpoints (experimental)"
    )

    args = parser.parse_args()

    if not Path(args.input).exists():
        print(f"Error: Input file not found: {args.input}")
        sys.exit(1)

    fixer = APIFixer(args.input)
    success = fixer.run(args.output, args.test_endpoints)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
