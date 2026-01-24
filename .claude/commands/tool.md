Create a new tool for this repository.

**User's idea**: $ARGUMENTS

Follow this workflow:

1. **Clarify the idea** (1-2 questions max)
   - What's the core use case? (if not clear from the description)
   - What are the inputs and outputs?
   - Any specific libraries needed, or should this be pure vanilla JS?

   Skip questions if the idea is already clear enough to build.

2. **Build the tool**
   - Start by reading `_template.html` as your base
   - Copy the template structure to `{tool-name}.html`
   - Modify the title, description, and tool logic
   - Use the existing CSS variables for theming (see AGENTS.md for the full list)
   - Create `{tool-name}.docs.md` with a 2-4 sentence description
   - Add entry to README.md under the appropriate category

3. **Test locally**
   - Start a local server: `python -m http.server 8000`
   - Open the tool in a browser to verify it works
   - Test both light and dark modes
   - Test on mobile viewport (375px width)
   - Use Playwright MCP tools if available for automated verification

4. **Commit and Push**
   - Stage the new files: `git add {tool-name}.html {tool-name}.docs.md README.md`
   - Commit with message: `Add {tool-name} tool` (include `Co-Authored-By: Claude <noreply@anthropic.com>`)
   - Push to remote: `git push`

Keep the tool simple and focused. Prefer real-time processing for instant operations, button-triggered for slower/error-prone ones. Always use CSS variables for colors so theming works correctly.
