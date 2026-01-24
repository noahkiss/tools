#!/usr/bin/env python3
"""
Build script for Noah's Tools
Generates tools.json from HTML files and their docs.md descriptions.

Supports both folder structure (preferred) and legacy flat files:
- Folder: {tool-name}/index.html with {tool-name}/docs.md
- Legacy: {tool-name}.html with {tool-name}.docs.md

Usage:
    python build.py
"""

import json
import re
from pathlib import Path


def extract_title(html_path: Path) -> str:
    """Extract the <title> from an HTML file."""
    try:
        content = html_path.read_text("utf-8", errors="ignore")
        match = re.search(r"<title>(.*?)</title>", content, re.IGNORECASE | re.DOTALL)
        if match:
            title = match.group(1).strip()
            # Remove suffix like " - Noah's Tools"
            title = re.sub(r"\s*[-–—]\s*Noah'?s?\s*Tools?$", "", title, flags=re.IGNORECASE)
            return title
    except OSError:
        pass
    return html_path.stem.replace("-", " ").title()


def extract_description(docs_path: Path) -> str:
    """Extract the first paragraph from a docs.md file."""
    if not docs_path.exists():
        return ""

    try:
        content = docs_path.read_text("utf-8").strip()
    except OSError:
        return ""

    # Remove HTML comments
    content = re.sub(r"<!--.*?-->", "", content, flags=re.DOTALL)

    # Get first paragraph
    lines = []
    for line in content.splitlines():
        stripped = line.strip()
        if not stripped:
            if lines:
                break
            continue
        lines.append(stripped)

    return " ".join(lines)


def extract_category(docs_path: Path) -> str:
    """Extract category from docs.md front matter or default to 'Utilities'."""
    if not docs_path.exists():
        return "Utilities"

    try:
        content = docs_path.read_text("utf-8")
        # Look for category in HTML comment: <!-- category: Text & Data -->
        match = re.search(r"<!--\s*category:\s*(.+?)\s*-->", content, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    except OSError:
        pass

    return "Utilities"


def find_tools(tools_dir: Path) -> list:
    """Find all tools in both folder and legacy flat file formats."""
    tools = []
    seen_slugs = set()

    # Directories/files to exclude
    exclude_dirs = {".git", ".claude", "node_modules", "__pycache__", "assets"}
    exclude_files = {"index.html", "_template.html"}

    # First, find folder-based tools: {tool-name}/index.html
    for subdir in sorted(tools_dir.iterdir()):
        if not subdir.is_dir():
            continue
        if subdir.name.startswith((".", "_")):
            continue
        if subdir.name in exclude_dirs:
            continue

        index_html = subdir / "index.html"
        if not index_html.exists():
            continue

        slug = subdir.name
        docs_path = subdir / "docs.md"

        tool = {
            "slug": slug,
            "title": extract_title(index_html),
            "description": extract_description(docs_path),
            "category": extract_category(docs_path),
        }

        tools.append(tool)
        seen_slugs.add(slug)
        print(f"  Found (folder): {tool['title']}")

    # Then, find legacy flat file tools: {tool-name}.html
    for html_file in sorted(tools_dir.glob("*.html")):
        if html_file.name in exclude_files:
            continue
        if html_file.name.startswith("_"):
            continue

        slug = html_file.stem

        # Skip if we already found this as a folder-based tool
        if slug in seen_slugs:
            continue

        docs_path = html_file.with_suffix(".docs.md")

        tool = {
            "slug": slug,
            "title": extract_title(html_file),
            "description": extract_description(docs_path),
            "category": extract_category(docs_path),
        }

        tools.append(tool)
        print(f"  Found (legacy): {tool['title']}")

    return tools


def main():
    tools_dir = Path(__file__).parent

    tools = find_tools(tools_dir)

    # Sort by title
    tools.sort(key=lambda t: t["title"].lower())

    # Write tools.json
    output_path = tools_dir / "tools.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(tools, f, indent=2, ensure_ascii=False)

    print(f"\nGenerated tools.json with {len(tools)} tools")

    # Update index.html with tools data
    index_path = tools_dir / "index.html"
    if index_path.exists():
        update_index_with_tools(index_path, tools)


def update_index_with_tools(index_path: Path, tools: list):
    """Inject tools data into index.html."""
    content = index_path.read_text("utf-8")

    # Find and replace the tools array
    tools_json = json.dumps(tools, indent=8)
    # Indent properly for the script
    tools_json = tools_json.replace("\n", "\n        ")

    # Replace the tools array (empty or populated)
    new_content = re.sub(
        r"const tools = \[[\s\S]*?\];",
        f"const tools = {tools_json};",
        content
    )

    if new_content != content:
        index_path.write_text(new_content, "utf-8")
        print("Updated index.html with tools data")


if __name__ == "__main__":
    print("Building tools.json...")
    main()
