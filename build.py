#!/usr/bin/env python3
"""
Build script for Noah's Tools
Generates tools.json from HTML files and their .docs.md descriptions.

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
    """Extract the first paragraph from a .docs.md file."""
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
    """Extract category from .docs.md front matter or default to 'Utilities'."""
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


def main():
    tools_dir = Path(__file__).parent
    html_files = sorted(tools_dir.glob("*.html"))

    # Files to exclude
    exclude = {"index.html", "_template.html"}

    tools = []

    for html_file in html_files:
        if html_file.name in exclude:
            continue
        if html_file.name.startswith("_"):
            continue

        slug = html_file.stem
        docs_path = html_file.with_suffix(".docs.md")

        tool = {
            "slug": slug,
            "title": extract_title(html_file),
            "description": extract_description(docs_path),
            "category": extract_category(docs_path),
        }

        tools.append(tool)
        print(f"  Found: {tool['title']}")

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

    # Replace the empty tools array
    new_content = re.sub(
        r"const tools = \[\];",
        f"const tools = {tools_json};",
        content
    )

    if new_content != content:
        index_path.write_text(new_content, "utf-8")
        print("Updated index.html with tools data")


if __name__ == "__main__":
    print("Building tools.json...")
    main()
