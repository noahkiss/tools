# Tools Repository - Agent Instructions

This repository contains single-file HTML tools hosted via GitHub Pages. Each tool is a self-contained, dependency-minimal web application that can be built entirely by an LLM in a single session.

> **Meta-Instruction**: This file should be self-updating. When you make structural changes to the repository, add new patterns, or establish new conventions, update this file to reflect those changes. Future Claude instances should always have accurate, up-to-date instructions.

> **Commit Policy**: Always commit and push after completing atomic units of work. Don't leave uncommitted changes. If you've made a meaningful change, commit it.

## Quick Start

Use the **`/tool` slash command** to create new tools. It handles the full workflow: clarifying requirements, building, testing, and committing.

```
/tool json to yaml converter
```

## Core Philosophy

**Single-file simplicity**: Every tool is one HTML file with inline CSS and JavaScript. No build step, no bundlers, no frameworks. This makes tools trivially easy to create, host, copy, and maintain.

**Low stakes experimentation**: These tools are small utilities. If one breaks or needs to be replaced, that's fine. This isn't production software—it's a collection of helpful gadgets.

**LLM-friendly architecture**: Keeping tools small (a few hundred lines) makes them easy for LLMs to read, understand, and modify. But don't artificially constrain yourself—if a tool needs more code to work well, that's fine.

---

## Creating a New Tool

### Step 1: Understand the Request

When the user describes a tool idea:
1. Clarify the core use case (what problem does it solve?)
2. Identify inputs and outputs
3. Determine if external libraries are needed
4. Consider edge cases and error states

### Step 2: Create the Tool Folder

**Structure**: Each tool lives in its own folder with an `index.html`:

```
{tool-name}/
├── index.html     # The tool itself
└── docs.md        # Documentation (2-4 sentences)
```

**Naming**: Use kebab-case for folder names (e.g., `json-formatter/`, `color-picker/`)

**URLs**: This gives clean URLs without `.html` extension:
- `https://noahkiss.github.io/tools/json-formatter/`
- `https://noahkiss.github.io/tools/color-picker/`

**Required structure**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tool Name</title>
    <style>
        /* Inline CSS here */
    </style>
</head>
<body>
    <!-- Tool UI here -->
    <script>
        // Inline JavaScript here
    </script>
</body>
</html>
```

### Step 3: Create Documentation

**Filename**: `{tool-name}/docs.md` (inside the tool folder)

**Content**: 1-2 sentences max. Describe what the tool does at a high level. This appears on the landing page, so keep it scannable.

**Avoid**:
- Syntax examples or code snippets (e.g., `` `{code:js}` ``)
- Listing every feature supported
- Technical implementation details

Example:
```markdown
<!-- category: Text & Data -->

Bidirectional converter between Jira wiki markup and Markdown. Edit either pane and the other updates in real-time.
```

### Step 4: Update the Index

Add the new tool to `README.md` under the appropriate category with a link:
```markdown
- [Tool Name](https://noahkiss.github.io/tools/tool-name) brief description
```

---

## Technical Constraints

### No Build Steps
- **No React, Vue, Angular, or Svelte** - these require compilation
- **No TypeScript** - stick to vanilla JavaScript
- **No npm/node_modules** - everything loads from CDN or is inline
- **No Sass/Less** - use plain CSS

### External Dependencies
When a library is genuinely helpful, load it from a CDN:

```html
<!-- Preferred CDNs -->
<script src="https://cdn.jsdelivr.net/npm/library@version/dist/library.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/library/version/library.min.js"></script>

<!-- For ES modules -->
<script type="module">
    import lib from 'https://cdn.jsdelivr.net/npm/library@version/+esm';
</script>
```

**Common useful libraries**:
- `turndown` - HTML to Markdown conversion (use this frequently)
- `marked` - Markdown to HTML parsing
- `tesseract.js` - OCR in browser
- `pdfjs-dist` - PDF rendering
- `sqlite-wasm` - SQLite in browser
- `cropperjs` - Image cropping
- `codemirror` - Code editor
- `prismjs` - Syntax highlighting

### Turndown (HTML → Markdown)

Turndown is used frequently for tools that convert web content to Markdown:

```html
<script src="https://cdn.jsdelivr.net/npm/turndown@7.1.2/dist/turndown.min.js"></script>
<script>
const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
});

// Optional: Add GFM plugin for tables, strikethrough, etc.
// <script src="https://cdn.jsdelivr.net/npm/turndown-plugin-gfm@1.0.2/dist/turndown-plugin-gfm.min.js"></script>
// turndownService.use(turndownPluginGfm.gfm);

const markdown = turndownService.turndown(htmlString);
</script>
```

Common Turndown customizations:
```javascript
// Keep certain elements as-is
turndownService.keep(['iframe', 'video']);

// Remove unwanted elements
turndownService.remove(['script', 'style', 'nav', 'footer']);

// Custom rules
turndownService.addRule('preserveLinks', {
    filter: 'a',
    replacement: (content, node) => {
        const href = node.getAttribute('href');
        return href ? `[${content}](${href})` : content;
    }
});
```

### State Persistence

Tools can be **stateless** (no persistence) or **stateful** (remember settings/data).

**URL Parameters** - Best for shareable state:
```javascript
// Save state to URL (shareable link)
function saveToUrl(state) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(state)) {
        params.set(key, typeof value === 'object' ? JSON.stringify(value) : value);
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    history.replaceState(null, '', newUrl);
}

// Load state from URL
function loadFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return Object.fromEntries(params.entries());
}

// Example: ?theme=dark&columns=3&filter=active
```

**URL Hash** - For large state or cleaner URLs:
```javascript
// Save state to hash (base64 encoded)
function saveToHash(state) {
    const json = JSON.stringify(state);
    const encoded = btoa(encodeURIComponent(json));
    window.location.hash = encoded;
}

// Load state from hash
function loadFromHash() {
    const hash = window.location.hash.slice(1);
    if (!hash) return null;
    try {
        return JSON.parse(decodeURIComponent(atob(hash)));
    } catch {
        return null;
    }
}

// Example: #eyJ0aGVtZSI6ImRhcmsifQ==
```

**localStorage** - For persistent user preferences (not shareable):
```javascript
const STORAGE_KEY = 'tool-name-settings';

function saveToStorage(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadFromStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
}

// Good for: API keys, theme preference, default settings
// Bad for: Data you want to share via URL
```

**Combined Pattern** - URL params override localStorage:
```javascript
function loadState() {
    const defaults = { theme: 'light', pageSize: 10 };
    const stored = loadFromStorage() || {};
    const urlParams = loadFromUrl();

    // URL params take priority (for sharing)
    return { ...defaults, ...stored, ...urlParams };
}

function saveState(state, { toUrl = false } = {}) {
    saveToStorage(state);
    if (toUrl) saveToUrl(state);
}
```

**When to use which:**
| Scenario | Method |
|----------|--------|
| Share exact tool state | URL params |
| Large/complex state | URL hash (base64) |
| User preferences | localStorage |
| API keys, secrets | localStorage only |
| One-time view | No persistence |

---

## Common Functionality Patterns

### URL Input via Hash

For tools that accept a URL as input (like HTML-to-Markdown converters), use the hash pattern:

```
https://noahkiss.github.io/tools/html-to-markdown/#https://example.com
```

```javascript
// Read URL from hash
function getInputUrl() {
    const hash = window.location.hash.slice(1); // Remove the #
    if (hash) {
        return decodeURIComponent(hash);
    }
    return null;
}

// Update hash when user enters a URL
function setInputUrl(url) {
    window.location.hash = encodeURIComponent(url);
}

// React to hash changes (back/forward navigation)
window.addEventListener('hashchange', () => {
    const url = getInputUrl();
    if (url) processUrl(url);
});

// Process on page load if hash exists
const initialUrl = getInputUrl();
if (initialUrl) processUrl(initialUrl);
```

### CORS Proxy for Fetching External Pages

Browsers block cross-origin requests. Use a CORS proxy to fetch external HTML/content.

**Preferred**: Our own Cloudflare Worker proxy (only accepts requests from our domain):
```javascript
const PROXY_URL = 'https://api.noahkiss.dev/proxy?url=';
// TODO: Set up tools-api Worker with /proxy endpoint
```

**Fallback** (for development/prototyping):
```javascript
// Public CORS proxies (less reliable, may have rate limits)
const CORS_PROXIES = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url='
];

async function fetchWithCorsProxy(url) {
    for (const proxy of CORS_PROXIES) {
        try {
            const response = await fetch(proxy + encodeURIComponent(url));
            if (response.ok) {
                return await response.text();
            }
        } catch (e) {
            continue; // Try next proxy
        }
    }
    throw new Error('Failed to fetch URL through all proxies');
}
```

### Clipboard Operations

```javascript
// Read from clipboard
async function readClipboard() {
    try {
        return await navigator.clipboard.readText();
    } catch (err) {
        console.error('Clipboard read failed:', err);
        return null;
    }
}

// Write to clipboard with feedback
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    });
}
```

### Query Parameters (Alternative to Hash)

For tools that need multiple URL parameters:

```javascript
// Read query params
const params = new URLSearchParams(window.location.search);
const url = params.get('url');
const format = params.get('format') || 'default';

// Build URL with params
function buildShareUrl(options) {
    const params = new URLSearchParams(options);
    return `${window.location.pathname}?${params.toString()}`;
}
```

### Download Generated Files

```javascript
function downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Examples
downloadFile(jsonString, 'data.json', 'application/json');
downloadFile(markdownText, 'document.md', 'text/markdown');
```

### Share API (Mobile-Friendly)

```javascript
async function shareContent(data) {
    if (navigator.share) {
        try {
            await navigator.share(data);
            return true;
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Share failed:', err);
            }
        }
    }
    // Fallback: copy to clipboard
    if (data.url) {
        await navigator.clipboard.writeText(data.url);
        return true;
    }
    return false;
}

// Usage
shareContent({
    title: 'Check out this tool',
    text: 'A useful web tool',
    url: window.location.href
});
```

---

## UI/UX Patterns

### Base CSS Template
```css
* {
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                 Helvetica, Arial, sans-serif;
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
    line-height: 1.6;
    color: #333;
    background: #f5f5f5;
}

.container {
    background: white;
    padding: 24px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

h1 {
    margin-top: 0;
    font-size: 24px;
}

/* Mobile responsive */
@media (max-width: 600px) {
    body { padding: 12px; }
    .container { padding: 16px; }
    h1 { font-size: 20px; }
}
```

### Form Elements
```css
input[type="text"],
input[type="url"],
textarea,
select {
    width: 100%;
    padding: 10px 12px;
    border: 2px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    font-family: inherit;
}

input:focus,
textarea:focus,
select:focus {
    outline: none;
    border-color: #4a90e2;
}

textarea {
    min-height: 120px;
    resize: vertical;
    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
}
```

### Buttons
```css
button {
    background: #4a90e2;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-family: inherit;
}

button:hover {
    background: #357abd;
}

button:disabled {
    background: #ccc;
    cursor: not-allowed;
}

button.secondary {
    background: #6c757d;
}

button.danger {
    background: #dc3545;
}
```

### Copy to Clipboard Pattern
```javascript
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.classList.add('copied');
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    });
}
```

### Error Display Pattern
```html
<div id="error" class="error"></div>

<style>
.error {
    color: #dc3545;
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    padding: 12px;
    border-radius: 4px;
    margin: 10px 0;
    display: none;
}

.error.visible {
    display: block;
}
</style>

<script>
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.classList.add('visible');
}

function hideError() {
    document.getElementById('error').classList.remove('visible');
}
</script>
```

### Loading State Pattern
```javascript
async function processWithLoading(button, asyncFn) {
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Processing...';

    try {
        return await asyncFn();
    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
}
```

### File Input with Drag & Drop
```html
<div id="dropzone" class="dropzone">
    Drag and drop a file here, or click to select
</div>
<input type="file" id="fileInput" hidden>

<style>
.dropzone {
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 40px;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
}

.dropzone:hover,
.dropzone.drag-over {
    border-color: #4a90e2;
    background: #f0f7ff;
}
</style>

<script>
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');

dropzone.addEventListener('click', () => fileInput.click());

dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
});

dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('drag-over');
});

dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    // Process files here
}
</script>
```

---

## Real-Time vs Button-Triggered Processing

**Use real-time processing** (`input` event) when:
- The operation is instant (< 50ms)
- Users benefit from immediate feedback
- Examples: text transformation, format conversion, filtering

**Use button-triggered processing** when:
- The operation is slow or expensive
- It involves network requests
- It might produce errors the user needs to see
- Examples: API calls, file processing, complex calculations

---

## Testing Tools Locally

Start a local server in the repo directory:
```bash
python -m http.server 8000
```

Then open `http://localhost:8000/tool-name/` in a browser (note the trailing slash).

---

## Tool Categories

Organize tools in README.md under these categories (add new categories as needed):

- **Text & Data** - formatters, converters, parsers
- **Image & Media** - image manipulation, media utilities
- **Development** - code helpers, debugging tools
- **Utilities** - calculators, generators, misc tools

---

## Quality Checklist

Before considering a tool complete:

- [ ] Works on mobile (test at 375px width)
- [ ] Has a clear, descriptive `<title>`
- [ ] Includes brief instructions in the UI
- [ ] Handles empty/invalid input gracefully
- [ ] Copy button works (if applicable)
- [ ] No console errors
- [ ] Documentation file created
- [ ] Added to README.md

---

## Templates

Templates live in the **`_templates/`** folder:

| Template | Purpose |
|----------|---------|
| `base.html` | Standard tool template with theming |

To preview a template locally:
```bash
python -m http.server 8000
# Open http://localhost:8000/_templates/base.html
```

### Template Structure

```
<html data-theme="light">        <!-- Theme state stored here -->
  <head>
    <style>
      :root { ... }              <!-- Light mode CSS variables -->
      [data-theme="dark"] { ... } <!-- Dark mode overrides -->
    </style>
  </head>
  <body>
    <header class="site-header">  <!-- Logo + theme toggle -->
    <main>
      <article class="tool-container">  <!-- Your tool UI -->
    </main>
    <footer class="site-footer">  <!-- GitHub link -->
  </body>
</html>
```

### How Theming Works

**CSS Variables**: All colors use CSS custom properties defined in `:root` (light) and `[data-theme="dark"]` (dark). Use these instead of hardcoded colors:

| Variable | Purpose |
|----------|---------|
| `--color-bg` | Page background |
| `--color-surface` | Card/container background |
| `--color-text` | Primary text |
| `--color-text-muted` | Secondary text |
| `--color-border` | Borders and dividers |
| `--color-primary` | Buttons, links, accents |
| `--color-primary-hover` | Hover state for primary |
| `--color-error` | Error text |
| `--color-error-bg` | Error background |
| `--color-success` | Success indicators |
| `--shadow` | Box shadows |

**Theme Toggle**: The toggle button switches `data-theme` on `<html>` between `"light"` and `"dark"`. User preference is saved to `localStorage` and restored on page load. System preference (`prefers-color-scheme`) is used as the default.

**Logo Switching**: Two logo images are included with classes `.logo-light` and `.logo-dark`. CSS shows/hides the appropriate one based on the current theme.

### Adding New Colors

If you need additional theme-aware colors, add them to both `:root` and `[data-theme="dark"]`:

```css
:root {
    --color-warning: #f0ad4e;
}

[data-theme="dark"] {
    --color-warning: #ffcc00;
}
```

Then use `var(--color-warning)` in your styles

---

## Git Workflow

**Always commit and push after creating or modifying tools.**

### Commit Message Templates

Use these formats, always including the tool name:

| Action | Format | Example |
|--------|--------|---------|
| New tool | `Add {tool-name} tool` | `Add json-formatter tool` |
| Bug fix | `Fix {tool-name}: {description}` | `Fix json-formatter: handle empty input` |
| Enhancement | `Update {tool-name}: {description}` | `Update color-picker: add hex input` |
| Styling | `Style {tool-name}: {description}` | `Style csv-parser: improve mobile layout` |
| Multiple tools | `Add {tool-1}, {tool-2} tools` | `Add base64-encoder, base64-decoder tools` |

### Commit and Push

After completing work on a tool:

```bash
git add {tool-name}/index.html {tool-name}/docs.md README.md
git commit -m "Add {tool-name} tool"
git push
```

Or for all changes:

```bash
git add -A
git commit -m "Add {tool-name} tool"
git push
```

### Co-Author Attribution

When Claude assists with creating a tool, include the co-author line:

```bash
git commit -m "Add {tool-name} tool

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Footer

The template includes `<script src="footer.js"></script>` which auto-injects a consistent footer with:
- Home link
- View Source (links to the file on GitHub)
- History (links to commit history)

The footer.js script automatically detects the current theme and styles itself accordingly using CSS variables.

**Note**: The footer is not added to index.html (the homepage has its own footer).

---

## Build Process

Run `python build.py` to:
1. Scan all tool folders (directories containing `index.html`)
2. Extract titles from `<title>` tags
3. Extract descriptions from `docs.md` files
4. Generate `tools.json` with tool metadata
5. Update `index.html` with the tools data for search

The build script should be run after adding new tools to update the search index:

```bash
python build.py
git add tools.json index.html
git commit -m "Rebuild tools index"
git push
```

### Category Support

To assign a tool to a specific category, add a comment to the `docs.md` file:

```markdown
<!-- category: Text & Data -->

This tool converts JSON to YAML format...
```

Available categories:
- **Text & Data** - formatters, converters, parsers
- **Image & Media** - image manipulation, media utilities
- **Development** - code helpers, debugging tools
- **Utilities** - calculators, generators, misc (default)

---

## Cloudflare Workers (Backend APIs)

Some tools need server-side logic that can't run in the browser:
- API keys that must stay secret
- Server-to-server requests (bypassing CORS)
- Data processing that's too heavy for client
- Persistent storage beyond localStorage

For these cases, use **Cloudflare Workers**. Workers live in a separate repo but integrate with tools here.

### Worker Repository Structure

Workers live in a separate repository (e.g., `tools-api` or similar):

```
tools-api/
├── wrangler.toml           # Cloudflare config
├── src/
│   └── index.ts            # Worker entry point
└── README.md
```

### Basic Worker Template

```typescript
// src/index.ts
export interface Env {
    // Secrets configured in Cloudflare dashboard
    API_KEY: string;
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        // CORS headers for tools to call this API
        const corsHeaders = {
            'Access-Control-Allow-Origin': 'https://noahkiss.github.io',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Handle preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Route handling
        if (url.pathname === '/api/convert') {
            const result = await handleConvert(request, env);
            return new Response(JSON.stringify(result), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response('Not found', { status: 404, headers: corsHeaders });
    }
};
```

### wrangler.toml

```toml
name = "tools-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# For production
# [env.production]
# routes = [{ pattern = "api.noahkiss.dev/*", zone_name = "noahkiss.dev" }]
```

### Calling Workers from Tools

```javascript
const API_BASE = 'https://tools-api.youraccount.workers.dev';
// Or custom domain: 'https://api.noahkiss.dev'

async function callWorker(endpoint, data) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    return response.json();
}

// Usage
const result = await callWorker('/api/convert', { url: 'https://example.com' });
```

### Common Worker Use Cases

| Use Case | Why Worker Needed |
|----------|-------------------|
| Fetch URLs server-side | Bypass CORS without public proxy |
| API integrations | Keep API keys secret |
| PDF generation | Heavy processing, needs server libs |
| Database storage | Persistent data with D1 or KV |
| Rate limiting | Protect downstream APIs |
| Authentication | Secure token validation |

### Deployment

```bash
# Install wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler deploy

# Set secrets
wrangler secret put API_KEY
```

### When to Use Workers vs CORS Proxy

| Scenario | Solution |
|----------|----------|
| Fetch public HTML | CORS proxy (`corsproxy.io`) |
| Fetch with API key | Worker |
| Simple GET requests | CORS proxy |
| POST with auth | Worker |
| Need caching control | Worker |
| Quick prototype | CORS proxy |
| Production tool | Worker |

### Future: Analytics via Worker

For privacy-respecting analytics, we can use a Worker endpoint that:
- Serves the favicon and logs the request (gives site-wide view count)
- Or receives a beacon/pixel request from tools (per-tool views)
- Stores counts in Cloudflare KV or D1
- No cookies, no personal data, just simple counts

Alternative: Use a lightweight privacy-focused analytics service like Plausible, Fathom, or GoatCounter.
