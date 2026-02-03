#!/usr/bin/env python3
"""
Venera Source Creator Skill Packager
"""

import argparse
import json
import os
import shutil
import sys
import tempfile
import yaml
import zipfile
from datetime import datetime
from pathlib import Path


def validate_skill(skill_dir):
    """Validate skill structure and content"""
    skill_path = Path(skill_dir)
    errors = []
    warnings = []

    # Check if directory exists
    if not skill_path.exists():
        errors.append(f"Skill directory not found: {skill_dir}")
        return errors, warnings

    # Check for SKILL.md
    skill_md = skill_path / "SKILL.md"
    if not skill_md.exists():
        errors.append("Missing required file: SKILL.md")
        return errors, warnings

    # Parse SKILL.md frontmatter
    with open(skill_md, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract YAML frontmatter
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            yaml_content = parts[1].strip()
            try:
                frontmatter = yaml.safe_load(yaml_content)

                # Validate required fields
                if not frontmatter.get("name"):
                    errors.append("Missing required frontmatter field: name")
                if not frontmatter.get("description"):
                    errors.append("Missing required frontmatter field: description")

                # Validate description quality
                description = frontmatter.get("description", "")
                if len(description) < 20:
                    warnings.append("Skill description may be too brief")
                if not description.startswith("This skill should be used when"):
                    warnings.append(
                        "Consider starting description with 'This skill should be used when...'"
                    )

            except yaml.YAMLError as e:
                errors.append(f"Invalid YAML frontmatter: {e}")
        else:
            errors.append("Invalid SKILL.md format: missing frontmatter")
    else:
        errors.append("SKILL.md must start with YAML frontmatter (---)")

    # Check for required directories
    for subdir in ["scripts", "references", "assets"]:
        dir_path = skill_path / subdir
        if dir_path.exists():
            # Check if directory has files
            files = list(dir_path.glob("*"))
            if not files:
                warnings.append(f"Directory '{subdir}' exists but is empty")
        else:
            warnings.append(f"Optional directory missing: {subdir}")

    # Validate script files are executable
    scripts_dir = skill_path / "scripts"
    if scripts_dir.exists():
        for script_file in scripts_dir.glob("*.py"):
            if not os.access(script_file, os.X_OK):
                warnings.append(f"Script may need executable permission: {script_file}")

    return errors, warnings


def create_zip_package(skill_dir, output_dir):
    """Create zip package of skill"""
    skill_path = Path(skill_dir)
    skill_name = skill_path.name

    # Create output directory if it doesn't exist
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Create zip filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    zip_filename = f"{skill_name}_{timestamp}.zip"
    zip_path = output_path / zip_filename

    # Create temporary directory for packaging
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)

        # Copy skill contents to temp directory
        shutil.copytree(skill_path, temp_path / skill_name)

        # Add README file with metadata
        skill_md = skill_path / "SKILL.md"
        with open(skill_md, "r", encoding="utf-8") as f:
            content = f.read()

        # Extract frontmatter for README
        frontmatter = {}
        if content.startswith("---"):
            parts = content.split("---", 2)
            if len(parts) >= 3:
                yaml_content = parts[1].strip()
                try:
                    frontmatter = yaml.safe_load(yaml_content)
                except yaml.YAMLError:
                    pass

        # Create README
        readme_content = f"""# {frontmatter.get("name", skill_name)} Skill

## Description
{frontmatter.get("description", "No description provided")}

## Installation
1. Extract this zip file to your Claude Code skills directory
2. The skill should be auto-detected by Claude Code

## Contents
- SKILL.md: Main skill documentation
- scripts/: Python scripts for source creation and validation
- references/: Detailed API and data model documentation
- assets/: Templates and examples

## Usage
This skill should be used when creating, fixing, or updating Venera manga/comic reader source configurations.

## Generated
{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
"""

        readme_path = temp_path / "README.md"
        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(readme_content)

        # Create zip file
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            # Add all files
            for file_path in temp_path.rglob("*"):
                if file_path.is_file():
                    arcname = file_path.relative_to(temp_path)
                    zipf.write(file_path, arcname)

    return zip_path


def main():
    parser = argparse.ArgumentParser(description="Package Venera Source Creator skill")
    parser.add_argument("skill_dir", help="Path to skill directory")
    parser.add_argument(
        "--output", "-o", default="./dist", help="Output directory (default: ./dist)"
    )
    parser.add_argument("--no-validate", action="store_true", help="Skip validation")

    args = parser.parse_args()

    # Validate skill
    if not args.no_validate:
        print("Validating skill structure...")
        errors, warnings = validate_skill(args.skill_dir)

        if warnings:
            print("\nWarnings:")
            for warning in warnings:
                print(f"  - {warning}")

        if errors:
            print("\nValidation errors:")
            for error in errors:
                print(f"  - {error}")
            print("\nFix errors before packaging.")
            sys.exit(1)

        print("Validation passed!")

    # Create package
    print("\nCreating skill package...")
    try:
        zip_path = create_zip_package(args.skill_dir, args.output)
        print(f"Skill packaged successfully: {zip_path}")

        # Show package contents
        print("\nPackage contents:")
        with zipfile.ZipFile(zip_path, "r") as zipf:
            for name in sorted(zipf.namelist()):
                print(f"  - {name}")

    except Exception as e:
        print(f"Packaging failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
