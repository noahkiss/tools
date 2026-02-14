# Tools Repository - Agent Instructions

This repository contains single-file HTML tools hosted via GitHub Pages. Each tool is a self-contained, dependency-minimal web application that can be built entirely by an LLM in a single session.

> **Meta-Instruction**: This file should be self-updating. When you make structural changes to the repository, add new patterns, or establish new conventions, update this file to reflect those changes. Future Claude instances should always have accurate, up-to-date instructions.

> **Slash Command Sync**: When updating workflows in this file, also update `.claude/commands/tool.md` to match. The slash command is what gets loaded when users run `/tool`, so it must stay in sync with these instructions.

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

## Tool Structure

Each tool lives in its own folder with source files:

```
{tool-name}/
├── content.html   # Main HTML content (inside <article>)
├── styles.css     # Tool-specific CSS
├── script.js      # Tool-specific JavaScript
├── docs.md        # Description and metadata
└── index.html     # BUILD ARTIFACT - auto-generated, never edit directly
```

**Naming**: Use kebab-case for folder names (e.g., `json-formatter/`, `color-picker/`)

**How it works**:
- `_template.html` contains the shared layout (header, footer, theme toggle)
- `build.py` combines template + source files to generate `index.html`
- A GitHub Action runs the build automatically on push
- **Never edit `index.html` directly** - it will be overwritten

**docs.md** - Category comment + 1-2 sentence description:

```markdown
<!-- title: Display Name -->
<!-- category: Text & Data -->
<!-- max-width: 1200px -->

Bidirectional converter between Jira wiki markup and Markdown. Edit either pane and the other updates in real-time.
```

Metadata (HTML comments at top of file):
- `<!-- title: Display Name -->` - Override auto-generated title (e.g., for acronyms like STFU)
- `<!-- category: Text & Data -->` - Which section on the landing page
- `<!-- max-width: 1400px -->` - Override default 900px max-width for wider tools

Available categories: Text & Data, Image & Media, Development, Utilities

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

### Real-Time vs Button-Triggered Processing

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

Build and start a local server:
```bash
uv run python build.py
uv run python -m http.server 8787
```

Then open `http://localhost:8787/tool-name/` in a browser (note the trailing slash).

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
- [ ] Both light and dark modes look correct
- [ ] Documentation file created
- [ ] Added to README.md

---

## How Theming Works

The template uses **Pico CSS v2** with **Catppuccin** color palettes (Latte for light, Mocha for dark).

**Available CSS variables** (use these in `styles.css`):

| Variable | Maps to |
|----------|---------|
| `--color-bg` | `--pico-background-color` |
| `--color-surface` | `--pico-card-background-color` |
| `--color-text` | `--pico-color` |
| `--color-text-muted` | `--pico-muted-color` |
| `--color-border` | `--pico-card-border-color` |
| `--color-primary` | `--pico-primary` |
| `--color-primary-hover` | `--pico-primary-hover` |
| `--color-error` | Catppuccin red |
| `--color-error-bg` | Catppuccin red bg |
| `--color-success` | Catppuccin green |
| `--shadow` | Theme-appropriate shadow |

The `--color-*` aliases exist for backward compatibility. Prefer them in tool CSS for portability. You can also use Pico's built-in variables directly (`--pico-primary`, etc.).

**Theme Toggle**: Switches `data-theme` on `<html>` between `"light"` and `"dark"`. Saved to `localStorage`, falls back to `prefers-color-scheme`.

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

---

## Footer

The template includes `<script src="footer.js"></script>` which auto-injects a consistent footer with:
- Home link
- View Source (links to the file on GitHub)
- History (links to commit history)

The footer.js script automatically detects the current theme and styles itself accordingly using CSS variables.

**Note**: The footer is not added to index.html (the homepage has its own footer).

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
