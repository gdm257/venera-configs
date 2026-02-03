#!/usr/bin/env python3
"""
Venera Source Creator - Generate new Venera source configuration files
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path


def load_template(template_path):
    """Load the Venera source template"""
    try:
        with open(template_path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        print(f"Error: Template not found at {template_path}")
        sys.exit(1)


def validate_source_name(name):
    """Validate source name format"""
    if not name or len(name.strip()) == 0:
        return False, "Source name cannot be empty"
    if len(name) > 50:
        return False, "Source name too long (max 50 characters)"
    return True, ""


def validate_source_key(key):
    """Validate source key format"""
    if not key or len(key.strip()) == 0:
        return False, "Source key cannot be empty"
    # Check if key is valid JavaScript identifier
    if not key[0].isalpha() and key[0] != "_":
        return False, "Source key must start with letter or underscore"
    if not all(c.isalnum() or c == "_" for c in key):
        return False, "Source key can only contain letters, numbers, and underscores"
    return True, ""


def validate_url(url):
    """Validate URL format"""
    if not url or len(url.strip()) == 0:
        return False, "URL cannot be empty"
    if not url.startswith(("http://", "https://")):
        return False, "URL must start with http:// or https://"
    return True, ""


def generate_source_file(template, config):
    """Generate source file from template and configuration"""
    replacements = {
        "{{CLASS_NAME}}": config["class_name"],
        "{{SOURCE_NAME}}": config["source_name"],
        "{{SOURCE_KEY}}": config["source_key"],
        "{{VERSION}}": config["version"],
        "{{MIN_APP_VERSION}}": config["min_app_version"],
        "{{URL}}": config["url"],
        "{{DESCRIPTION}}": config.get("description", ""),
        "{{LANGUAGE}}": config.get("language", "en"),
        "{{TIMEZONE}}": config.get("timezone", "UTC"),
        "{{CREATED_AT}}": datetime.now().strftime("%Y-%m-%d"),
        "{{AUTHOR}}": config.get("author", ""),
    }

    source_content = template
    for key, value in replacements.items():
        source_content = source_content.replace(key, value)

    return source_content


def interactive_prompt():
    """Interactive prompt for source creation"""
    print("=== Venera Source Creator ===")
    print("Create a new manga/comic source configuration for Venera")
    print()

    config = {}

    # Source name
    while True:
        name = input("Source display name (e.g., 'MangaDex'): ").strip()
        valid, message = validate_source_name(name)
        if valid:
            config["source_name"] = name
            break
        print(f"Error: {message}")

    # Source key
    while True:
        key = input("Source key (camelCase, e.g., 'mangaDex'): ").strip()
        valid, message = validate_source_key(key)
        if valid:
            config["source_key"] = key
            config["class_name"] = key[0].upper() + key[1:] + "ComicSource"
            break
        print(f"Error: {message}")

    # URL
    while True:
        url = input("Base URL (e.g., 'https://api.mangadex.org'): ").strip()
        valid, message = validate_url(url)
        if valid:
            config["url"] = url
            break
        print(f"Error: {message}")

    # Optional fields
    description = input("Description (optional): ").strip()
    if description:
        config["description"] = description

    language = input("Language code (default: 'en'): ").strip() or "en"
    config["language"] = language

    timezone = input("Timezone (default: 'UTC'): ").strip() or "UTC"
    config["timezone"] = timezone

    author = input("Author name (optional): ").strip()
    if author:
        config["author"] = author

    # Version info
    config["version"] = "1.0.0"
    config["min_app_version"] = "1.0.0"

    return config


def main():
    parser = argparse.ArgumentParser(description="Create Venera source configuration")
    parser.add_argument("--name", help="Source display name")
    parser.add_argument("--key", help="Source key (camelCase)")
    parser.add_argument("--url", help="Base URL")
    parser.add_argument("--description", help="Source description")
    parser.add_argument("--language", default="en", help="Language code")
    parser.add_argument("--timezone", default="UTC", help="Timezone")
    parser.add_argument("--author", help="Author name")
    parser.add_argument("--output", default=None, help="Output file path")
    parser.add_argument("--template", default=None, help="Template file path")
    parser.add_argument(
        "--interactive", action="store_true", help="Use interactive mode"
    )

    args = parser.parse_args()

    # Determine template path
    if args.template:
        template_path = args.template
    else:
        # Try to find template relative to script
        script_dir = Path(__file__).parent.parent
        template_path = script_dir / "assets" / "template.js"
        if not template_path.exists():
            print("Error: Default template not found. Please specify --template")
            sys.exit(1)

    # Load template
    template = load_template(template_path)

    # Get configuration
    if args.interactive or (not args.name and not args.key and not args.url):
        config = interactive_prompt()
    else:
        # Validate required arguments
        if not args.name:
            print("Error: --name is required in non-interactive mode")
            sys.exit(1)
        if not args.key:
            print("Error: --key is required in non-interactive mode")
            sys.exit(1)
        if not args.url:
            print("Error: --url is required in non-interactive mode")
            sys.exit(1)

        # Validate inputs
        valid, message = validate_source_name(args.name)
        if not valid:
            print(f"Error: {message}")
            sys.exit(1)

        valid, message = validate_source_key(args.key)
        if not valid:
            print(f"Error: {message}")
            sys.exit(1)

        valid, message = validate_url(args.url)
        if not valid:
            print(f"Error: {message}")
            sys.exit(1)

        config = {
            "source_name": args.name,
            "source_key": args.key,
            "class_name": args.key[0].upper() + args.key[1:] + "ComicSource",
            "url": args.url,
            "description": args.description or "",
            "language": args.language,
            "timezone": args.timezone,
            "author": args.author or "",
            "version": "1.0.0",
            "min_app_version": "1.0.0",
        }

    # Determine output file path
    output_path = None
    if args.output:
        output_path = Path(args.output)
    else:
        # Generate filename from source key, default to project root
        filename = config["source_key"].lower().replace("_", "-") + ".js"
        output_path = Path(filename)
        print(f"No output path specified, defaulting to: {output_path}")

    # Check if file already exists
    if output_path.exists():
        overwrite = (
            input(f"File {output_path} already exists. Overwrite? (y/N): ")
            .strip()
            .lower()
        )
        if overwrite != "y":
            print("Aborted")
            sys.exit(0)

    # Generate source file
    source_content = generate_source_file(template, config)

    # Write output
    try:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(source_content)

        print(f"Successfully created source configuration: {output_path}")
        print()
        print("Next steps:")
        print(f"1. Review and customize {output_path}")
        print("2. Implement required methods (search, explore, etc.)")
        print("3. Add to project's source registry (if applicable)")
        print("4. Test with Venera app")

    except Exception as e:
        print(f"Error writing file: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
