# Tools Repository - Agent Instructions

This repository contains single-file HTML tools hosted via GitHub Pages. Each tool is a self-contained, dependency-minimal web application that can be built entirely by an LLM in a single session.

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

### Step 2: Create the HTML File

**Filename**: `{tool-name}.html` using kebab-case (e.g., `json-formatter.html`, `color-picker.html`)

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

**Filename**: `{tool-name}.docs.md`

**Content**: 2-4 sentences describing what the tool does and how to use it. Keep it brief and practical.

Example:
```markdown
Converts JSON to YAML format. Paste or type JSON in the input area and see the
YAML output update in real-time. Handles nested objects, arrays, and all standard
JSON types. Copy the result with the clipboard button.
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
- `marked` - Markdown parsing
- `tesseract.js` - OCR in browser
- `pdfjs-dist` - PDF rendering
- `sqlite-wasm` - SQLite in browser
- `cropperjs` - Image cropping
- `codemirror` - Code editor
- `prismjs` - Syntax highlighting

### State Persistence
- **URL hash**: For shareable state (e.g., `#config=base64data`)
- **localStorage**: For user preferences and sensitive data like API keys
- **No server-side storage**: These are client-only tools

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

Then open `http://localhost:8000/tool-name.html` in a browser.

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

## Template

The base template lives at **`_template.html`**. Copy it to create new tools.

To preview the template locally:
```bash
python -m http.server 8000
# Open http://localhost:8000/_template.html
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

## Commit Messages

When creating or updating tools, use descriptive commit messages:

- `Add json-formatter tool` - for new tools
- `Fix edge case in json-formatter when input is empty` - for bug fixes
- `Improve mobile layout for color-picker` - for improvements

Include a link to any relevant conversation transcript if the tool was created via LLM assistance.
