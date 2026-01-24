Create a new tool for this repository.

**User's idea**: $ARGUMENTS

Follow this workflow:

1. **Clarify the idea** (1-2 questions max)
   - What's the core use case? (if not clear from the description)
   - What are the inputs and outputs?
   - Any specific libraries needed, or should this be pure vanilla JS?

   Skip questions if the idea is already clear enough to build.

2. **Build the tool**
   - Create `{tool-name}.html` following patterns in AGENTS.md
   - Create `{tool-name}.docs.md` with a 2-4 sentence description
   - Add entry to README.md under the appropriate category

3. **Test locally**
   - Start a local server: `python -m http.server 8000`
   - Open the tool in a browser to verify it works
   - Use Playwright MCP tools if available for automated verification

4. **Commit**
   - Stage the new files
   - Commit with message: `Add {tool-name} tool`

Keep the tool simple and focused. Prefer real-time processing for instant operations, button-triggered for slower/error-prone ones.
