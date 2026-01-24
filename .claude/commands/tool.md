Create a new tool for this repository.

**User's idea**: $ARGUMENTS

Follow this workflow:

1. **Always ask 2-3 clarifying questions first** (use AskUserQuestion tool)

   Even if the idea seems clear, ask questions to uncover hidden requirements:
   - **Directionality**: Is this one-way or bidirectional? (e.g., "Jira to Markdown" vs "Jira ↔ Markdown")
   - **Edge cases**: Are there known quirks or variations to handle? Does the user have a spec/reference doc?
   - **Scope**: What features are must-have vs nice-to-have? Any features to explicitly exclude?
   - **Input/Output**: What formats? File upload, paste, URL input? Download, copy, preview?
   - **Libraries**: Any specific libraries to use or avoid? Pure vanilla JS preferred?

   Ask 2-3 of the most relevant questions for this specific tool idea. Don't skip this step.

2. **Build the tool**
   - Read `_templates/base.html` as your base
   - Create `{tool-name}/index.html` (folder structure for clean URLs)
   - Modify the title, description, and tool logic
   - Use the existing CSS variables for theming (see AGENTS.md for the full list)
   - Create `{tool-name}/docs.md` with:
     - Category comment: `<!-- category: Text & Data -->` (or Image & Media, Development, Utilities)
     - 2-4 sentence description of what the tool does
   - If the tool needs URL input, use the hash pattern (see AGENTS.md "URL Input via Hash")
   - If the tool fetches external content, use CORS proxies (see AGENTS.md "CORS Proxy for Fetching External Pages")

3. **Test locally**
   - Start a local server: `python -m http.server 8000`
   - Open `http://localhost:8000/{tool-name}/` in a browser
   - Test both light and dark modes
   - Test on mobile viewport (375px width)
   - Use Playwright MCP tools if available for automated verification

4. **Build and Commit**
   - Run `python build.py` to update the search index
   - Stage all files: `git add {tool-name}/index.html {tool-name}/docs.md tools.json index.html`
   - Commit with message: `Add {tool-name} tool` (include `Co-Authored-By: Claude <noreply@anthropic.com>`)
   - Push to remote: `git push`

Keep the tool simple and focused. Prefer real-time processing for instant operations, button-triggered for slower/error-prone ones. Always use CSS variables for colors so theming works correctly.
