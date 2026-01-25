#!/usr/bin/env python3
"""
Build script for Noah's Tools

This script:
1. Builds index.html for each tool from template + source files
2. Generates tools.json from tool metadata
3. Updates the main index.html with tools data

Tool source structure:
- {tool-name}/content.html  - Main HTML content
- {tool-name}/styles.css    - Tool-specific CSS
- {tool-name}/script.js     - Tool-specific JavaScript
- {tool-name}/docs.md       - Description and metadata (category, max-width)

Usage:
    python build.py
"""

import json
import re
from pathlib import Path


def extract_title_from_content(content_path: Path) -> str:
    """Extract title from the first h1 in content.html, or derive from folder name."""
    if content_path.exists():
        try:
            content = content_path.read_text("utf-8")
            # Look for first text that would be a title
            # The h1 is now in the template, so use folder name
        except OSError:
            pass
    return content_path.parent.name.replace("-", " ").title()


def extract_metadata(docs_path: Path) -> dict:
    """Extract metadata from docs.md comments."""
    metadata = {
        "category": "Utilities",
        "max_width": "900px",
        "description": "",
    }

    if not docs_path.exists():
        return metadata

    try:
        content = docs_path.read_text("utf-8")

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


def build_tool_html(tool_dir: Path, template: str) -> bool:
    """Build index.html for a tool from template and source files."""
    content_path = tool_dir / "content.html"
    styles_path = tool_dir / "styles.css"
    script_path = tool_dir / "script.js"
    docs_path = tool_dir / "docs.md"
    index_path = tool_dir / "index.html"

    # Check if source files exist
    if not content_path.exists():
        return False  # Not a template-based tool

    # Read source files
    content = content_path.read_text("utf-8") if content_path.exists() else ""
    styles = styles_path.read_text("utf-8") if styles_path.exists() else ""
    script = script_path.read_text("utf-8") if script_path.exists() else ""

    # Get metadata
    metadata = extract_metadata(docs_path)

    # Derive title from folder name (capitalize properly)
    title = tool_dir.name.replace("-", " ").title()
    # Special case handling
    if tool_dir.name == "jiradown":
        title = "Jiradown"

    # Build the HTML
    html = template
    html = html.replace("{{TITLE}}", title)
    html = html.replace("{{DESCRIPTION}}", metadata["description"])
    html = html.replace("{{MAX_WIDTH}}", metadata["max_width"])

    # Insert content, styles, and script without extra indentation
    # (indentation in source files is preserved as-is)
    html = html.replace("{{CONTENT}}", content)
    html = html.replace("{{STYLES}}", styles)
    html = html.replace("{{SCRIPT}}", script)

    # Write the built HTML
    index_path.write_text(html, "utf-8")
    return True


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

    # Directories to exclude
    exclude_dirs = {".git", ".github", ".claude", "node_modules", "__pycache__", "assets"}

    # Find folder-based tools
    for subdir in sorted(tools_dir.iterdir()):
        if not subdir.is_dir():
            continue
        if subdir.name.startswith((".", "_")):
            continue
        if subdir.name in exclude_dirs:
            continue

        docs_path = subdir / "docs.md"
        content_path = subdir / "content.html"
        index_path = subdir / "index.html"

        # Must have either content.html (template-based) or index.html (legacy)
        if not content_path.exists() and not index_path.exists():
            continue

        # Build from template if source files exist
        if template and content_path.exists():
            if build_tool_html(subdir, template):
                print(f"  Built: {subdir.name}/index.html")

        # Get metadata
        metadata = extract_metadata(docs_path)

        # Derive title
        title = subdir.name.replace("-", " ").title()
        if subdir.name == "jiradown":
            title = "Jiradown"

        tool = {
            "slug": subdir.name,
            "title": title,
            "description": metadata["description"],
            "category": metadata["category"],
        }

        tools.append(tool)

    return tools


def update_main_index(index_path: Path, tools: list):
    """Inject tools data into the main index.html."""
    if not index_path.exists():
        return

    content = index_path.read_text("utf-8")

    # Find and replace the tools array
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
