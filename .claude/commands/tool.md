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

2. **Build the tool using the template system**

   Read AGENTS.md for full details. Key points:

   **Create these source files** (NOT index.html directly):
   ```
   {tool-name}/
   ├── content.html   # Main HTML content (goes inside <article>)
   ├── styles.css     # Tool-specific CSS (uses theme variables)
   ├── script.js      # Tool-specific JavaScript
   └── docs.md        # Description and metadata
   ```

   **content.html** - Just the tool UI, no boilerplate:
   ```html
   <div class="my-tool">
       <input type="text" id="input" placeholder="Enter text...">
       <button id="convert">Convert</button>
       <output id="result"></output>
   </div>
   ```

   **styles.css** - Tool-specific styles (theme variables are available):
   ```css
   .my-tool {
       display: flex;
       flex-direction: column;
       gap: 16px;
   }
   ```

   **script.js** - Tool logic (no theme toggle code needed, it's in template):
   ```javascript
   document.getElementById('convert').addEventListener('click', () => {
       const input = document.getElementById('input').value;
       document.getElementById('result').textContent = processInput(input);
   });
   ```

   **docs.md** - Metadata comments + 1-2 sentence description:
   ```markdown
   <!-- title: Display Name -->
   <!-- category: Text & Data -->

   Converts JSON to YAML format. Paste JSON in the left pane and get YAML output in real-time.
   ```

   Metadata fields:
   - `<!-- title: Display Name -->` - Override auto-generated title (for acronyms, casing, etc.)
   - `<!-- category: Text & Data -->` - Landing page section (Text & Data, Image & Media, Development, Utilities)
   - `<!-- max-width: 1200px -->` - Override default 900px for wider tools

   **IMPORTANT**:
   - Do NOT create index.html manually - it's a build artifact
   - Use CSS variables for colors (see AGENTS.md for full list)
   - If the tool needs URL input, use the hash pattern (see AGENTS.md)
   - If fetching external content, use CORS proxies (see AGENTS.md)

3. **Build and test locally**
   - Run `uv run python build.py` to generate index.html from template + source files
   - Start server: `uv run python -m http.server 8787`
   - Open `http://localhost:8787/{tool-name}/` in browser
   - Test light/dark modes and mobile viewport (375px width)
   - Use Playwright MCP tools if available for automated verification

4. **Commit and push**
   - Stage source files: `git add {tool-name}/content.html {tool-name}/styles.css {tool-name}/script.js {tool-name}/docs.md`
   - Stage build artifacts: `git add {tool-name}/index.html tools.json index.html`
   - Commit: `Add {tool-name} tool`
   - Push: `git push`

Keep tools simple and focused. Prefer real-time processing for instant operations, button-triggered for slower/error-prone ones.
