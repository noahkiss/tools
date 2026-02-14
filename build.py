#!/usr/bin/env python3
"""
Build script for Noah's Tools

This script:
1. Validates tool source files for common issues
2. Builds index.html for each tool from template + source files
3. Generates tools.json from tool metadata
4. Updates the main index.html with tools data

Tool source structure:
- {tool-name}/content.html  - Main HTML content
- {tool-name}/styles.css    - Tool-specific CSS
- {tool-name}/script.js     - Tool-specific JavaScript
- {tool-name}/docs.md       - Description and metadata (title, category, max-width)

Usage:
    python build.py
    python build.py validate   # Run validation only
"""

import json
import re
import sys
from pathlib import Path

# Directories to skip when scanning for tools
EXCLUDE_DIRS = {".git", ".github", ".claude", "node_modules", "__pycache__", "assets"}

KNOWN_CATEGORIES = {"Text & Data", "Image & Media", "Development", "Utilities"}


def extract_metadata(docs_path: Path) -> dict:
    """Extract metadata from docs.md comments.

    Supported metadata comments:
    - <!-- title: Display Name -->
    - <!-- category: Text & Data -->
    - <!-- max-width: 1200px -->
    """
    metadata = {
        "title": "",
        "category": "Utilities",
        "max_width": "900px",
        "description": "",
    }

    if not docs_path.exists():
        return metadata

    try:
        content = docs_path.read_text("utf-8")

        # Extract title
        match = re.search(r"<!--\s*title:\s*(.+?)\s*-->", content, re.IGNORECASE)
        if match:
            metadata["title"] = match.group(1).strip()

        # Extract category
        match = re.search(r"<!--\s*category:\s*(.+?)\s*-->", content, re.IGNORECASE)
        if match:
            metadata["category"] = match.group(1).strip()

        # Extract max-width
        match = re.search(r"<!--\s*max-width:\s*(.+?)\s*-->", content, re.IGNORECASE)
        if match:
            metadata["max_width"] = match.group(1).strip()

        # Extract description (first paragraph after comments)
        desc_content = re.sub(r"<!--.*?-->", "", content, flags=re.DOTALL).strip()
        lines = []
        for line in desc_content.splitlines():
            stripped = line.strip()
            if not stripped:
                if lines:
                    break
                continue
            lines.append(stripped)
        metadata["description"] = " ".join(lines)

    except OSError:
        pass

    return metadata


def get_title(tool_dir: Path, metadata: dict) -> str:
    """Get display title from metadata, falling back to folder name."""
    if metadata["title"]:
        return metadata["title"]
    return tool_dir.name.replace("-", " ").title()


def build_tool_html(tool_dir: Path, template: str) -> bool:
    """Build index.html for a tool from template and source files."""
    content_path = tool_dir / "content.html"
    styles_path = tool_dir / "styles.css"
    script_path = tool_dir / "script.js"
    docs_path = tool_dir / "docs.md"
    index_path = tool_dir / "index.html"

    if not content_path.exists():
        return False

    # Read source files
    content = content_path.read_text("utf-8")
    styles = styles_path.read_text("utf-8") if styles_path.exists() else ""
    script = script_path.read_text("utf-8") if script_path.exists() else ""

    # Get metadata and title
    metadata = extract_metadata(docs_path)
    title = get_title(tool_dir, metadata)

    # Build the HTML
    html = template
    html = html.replace("{{TITLE}}", title)
    html = html.replace("{{DESCRIPTION}}", metadata["description"])
    html = html.replace("{{MAX_WIDTH}}", metadata["max_width"])
    html = html.replace("{{CONTENT}}", content)
    html = html.replace("{{STYLES}}", styles)
    html = html.replace("{{SCRIPT}}", script)

    index_path.write_text(html, "utf-8")
    return True


def find_tool_dirs(tools_dir: Path) -> list[Path]:
    """Find all tool directories."""
    dirs = []
    for subdir in sorted(tools_dir.iterdir()):
        if not subdir.is_dir():
            continue
        if subdir.name.startswith((".", "_")):
            continue
        if subdir.name in EXCLUDE_DIRS:
            continue
        # Must have either content.html (template-based) or index.html (legacy)
        if not (subdir / "content.html").exists() and not (subdir / "index.html").exists():
            continue
        dirs.append(subdir)
    return dirs


def validate_tools(tool_dirs: list[Path]) -> tuple[list[str], list[str]]:
    """Validate tool source files. Returns (errors, warnings)."""
    errors = []
    warnings = []

    for tool_dir in tool_dirs:
        name = tool_dir.name

        # Required: content.html
        if not (tool_dir / "content.html").exists():
            if (tool_dir / "index.html").exists():
                warnings.append(f"{name}: legacy tool (no content.html, has index.html)")
            else:
                errors.append(f"{name}: missing content.html")
            continue

        # Recommended files
        for filename in ("styles.css", "script.js", "docs.md"):
            if not (tool_dir / filename).exists():
                warnings.append(f"{name}: missing {filename}")

        # Validate docs.md
        docs_path = tool_dir / "docs.md"
        if docs_path.exists():
            metadata = extract_metadata(docs_path)

            if not metadata["description"]:
                warnings.append(f"{name}: docs.md has no description")

            if metadata["category"] not in KNOWN_CATEGORIES:
                warnings.append(
                    f"{name}: unknown category '{metadata['category']}' "
                    f"(known: {', '.join(sorted(KNOWN_CATEGORIES))})"
                )

        # Validate content.html doesn't contain full HTML document tags
        content = (tool_dir / "content.html").read_text("utf-8")
        for tag in ("<html", "<head", "<body"):
            if tag in content.lower():
                warnings.append(
                    f"{name}: content.html contains {tag}> tag "
                    f"(should only contain content inside <article>)"
                )

        # Check for hardcoded hex colors in styles.css
        styles_path = tool_dir / "styles.css"
        if styles_path.exists():
            styles = styles_path.read_text("utf-8")
            hex_matches = re.findall(r"#[0-9a-fA-F]{3,8}\b", styles)
            if hex_matches:
                warnings.append(
                    f"{name}: styles.css has hardcoded colors "
                    f"({', '.join(hex_matches[:3])}...) - prefer CSS variables"
                )

    return errors, warnings


def find_and_build_tools(tools_dir: Path) -> list:
    """Find all tools, build their HTML, and return metadata."""
    tools = []

    # Load template
    template_path = tools_dir / "_template.html"
    if not template_path.exists():
        print("Warning: _template.html not found, skipping tool HTML builds")
        template = None
    else:
        template = template_path.read_text("utf-8")

    tool_dirs = find_tool_dirs(tools_dir)

    # Validate
    errors, warnings = validate_tools(tool_dirs)
    for w in warnings:
        print(f"  WARN: {w}")
    for e in errors:
        print(f"  ERROR: {e}")
    if errors:
        print(f"\n{len(errors)} error(s) found. Fix before building.")
        sys.exit(1)

    # Build each tool
    for subdir in tool_dirs:
        if template and (subdir / "content.html").exists():
            if build_tool_html(subdir, template):
                print(f"  Built: {subdir.name}/index.html")

        metadata = extract_metadata(subdir / "docs.md")
        title = get_title(subdir, metadata)

        tools.append({
            "slug": subdir.name,
            "title": title,
            "description": metadata["description"],
            "category": metadata["category"],
        })

    return tools


def update_main_index(index_path: Path, tools: list):
    """Inject tools data into the main index.html."""
    if not index_path.exists():
        return

    content = index_path.read_text("utf-8")

    tools_json = json.dumps(tools, indent=8)
    tools_json = tools_json.replace("\n", "\n        ")

    new_content = re.sub(
        r"const tools = \[[\s\S]*?\];",
        f"const tools = {tools_json};",
        content
    )

    if new_content != content:
        index_path.write_text(new_content, "utf-8")
        print("Updated main index.html with tools data")


def main():
    tools_dir = Path(__file__).parent

    # Check for validate-only mode
    if len(sys.argv) > 1 and sys.argv[1] == "validate":
        tool_dirs = find_tool_dirs(tools_dir)
        errors, warnings = validate_tools(tool_dirs)
        for w in warnings:
            print(f"  WARN: {w}")
        for e in errors:
            print(f"  ERROR: {e}")
        if not errors and not warnings:
            print("All tools valid.")
        sys.exit(1 if errors else 0)

    print("Building tools...")
    tools = find_and_build_tools(tools_dir)

    # Sort by title
    tools.sort(key=lambda t: t["title"].lower())

    # Write tools.json
    output_path = tools_dir / "tools.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(tools, f, indent=2, ensure_ascii=False)
    print(f"\nGenerated tools.json with {len(tools)} tools")

    # Update main index.html
    update_main_index(tools_dir / "index.html", tools)


if __name__ == "__main__":
    main()
