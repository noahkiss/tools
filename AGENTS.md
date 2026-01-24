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

## Example: Tool Template

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tool Name - Noah's Tools</title>
    <style>
        /* ===== Theme Variables ===== */
        :root {
            --color-bg: #f8f9fa;
            --color-surface: #ffffff;
            --color-text: #1a1a2e;
            --color-text-muted: #6c757d;
            --color-border: #dee2e6;
            --color-primary: #4a90e2;
            --color-primary-hover: #357abd;
            --color-error: #dc3545;
            --color-error-bg: #f8d7da;
            --color-success: #28a745;
            --shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        [data-theme="dark"] {
            --color-bg: #1a1a2e;
            --color-surface: #252542;
            --color-text: #e8e8e8;
            --color-text-muted: #a0a0a0;
            --color-border: #3d3d5c;
            --color-primary: #5c9ce6;
            --color-primary-hover: #7ab3f0;
            --color-error: #f87171;
            --color-error-bg: #3d2a2a;
            --shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        /* ===== Base Styles ===== */
        * { box-sizing: border-box; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                         Helvetica, Arial, sans-serif;
            background: var(--color-bg);
            color: var(--color-text);
            margin: 0;
            padding: 0;
            min-height: 100vh;
            line-height: 1.6;
            transition: background 0.3s, color 0.3s;
        }

        /* ===== Layout ===== */
        .site-header {
            background: var(--color-surface);
            border-bottom: 1px solid var(--color-border);
            padding: 12px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .site-logo {
            display: flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
            color: var(--color-text);
            font-weight: 600;
        }

        .site-logo img {
            height: 32px;
            width: auto;
        }

        /* Theme-aware logo switching */
        .logo-dark { display: none; }
        .logo-light { display: block; }

        [data-theme="dark"] .logo-dark { display: block; }
        [data-theme="dark"] .logo-light { display: none; }

        .theme-toggle {
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: 6px;
            padding: 8px 12px;
            cursor: pointer;
            font-size: 16px;
            transition: background 0.2s;
        }

        .theme-toggle:hover {
            background: var(--color-bg);
        }

        main {
            max-width: 800px;
            margin: 0 auto;
            padding: 24px 20px;
        }

        .tool-container {
            background: var(--color-surface);
            border-radius: 8px;
            padding: 24px;
            box-shadow: var(--shadow);
        }

        h1 {
            margin: 0 0 8px 0;
            font-size: 24px;
        }

        .tool-description {
            color: var(--color-text-muted);
            margin: 0 0 24px 0;
        }

        /* ===== Form Elements ===== */
        label {
            display: block;
            margin-bottom: 6px;
            font-weight: 500;
        }

        textarea, input[type="text"], input[type="url"] {
            width: 100%;
            padding: 12px;
            border: 2px solid var(--color-border);
            border-radius: 6px;
            background: var(--color-bg);
            color: var(--color-text);
            font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
            font-size: 14px;
            transition: border-color 0.2s;
        }

        textarea:focus, input:focus {
            outline: none;
            border-color: var(--color-primary);
        }

        textarea {
            min-height: 150px;
            resize: vertical;
        }

        /* ===== Buttons ===== */
        .button-group {
            display: flex;
            gap: 10px;
            margin-top: 16px;
            flex-wrap: wrap;
        }

        button {
            background: var(--color-primary);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: background 0.2s;
        }

        button:hover {
            background: var(--color-primary-hover);
        }

        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        button.secondary {
            background: var(--color-border);
            color: var(--color-text);
        }

        button.secondary:hover {
            background: var(--color-text-muted);
            color: white;
        }

        /* ===== Output & Errors ===== */
        .error {
            color: var(--color-error);
            background: var(--color-error-bg);
            padding: 12px;
            border-radius: 6px;
            margin-top: 16px;
            display: none;
        }

        .error.visible { display: block; }

        .output {
            margin-top: 24px;
            padding: 16px;
            background: var(--color-bg);
            border-radius: 6px;
            display: none;
        }

        .output.visible { display: block; }

        .output-label {
            font-weight: 600;
            margin-bottom: 8px;
        }

        .output pre {
            margin: 0;
            white-space: pre-wrap;
            word-break: break-word;
            font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
            font-size: 14px;
        }

        /* ===== Footer ===== */
        .site-footer {
            text-align: center;
            padding: 24px;
            color: var(--color-text-muted);
            font-size: 14px;
        }

        .site-footer a {
            color: var(--color-primary);
            text-decoration: none;
        }

        .site-footer a:hover {
            text-decoration: underline;
        }

        /* ===== Responsive ===== */
        @media (max-width: 600px) {
            main { padding: 16px 12px; }
            .tool-container { padding: 16px; }
            h1 { font-size: 20px; }
            .button-group { flex-direction: column; }
            button { width: 100%; }
        }
    </style>
</head>
<body>
    <header class="site-header">
        <a href="/" class="site-logo">
            <img src="assets/logo-black-64.png" alt="" class="logo-light">
            <img src="assets/logo-white-64.png" alt="" class="logo-dark">
            <span>Noah's Tools</span>
        </a>
        <button class="theme-toggle" id="themeToggle" aria-label="Toggle dark mode">
            🌙
        </button>
    </header>

    <main>
        <article class="tool-container">
            <h1>Tool Name</h1>
            <p class="tool-description">Brief description of what this tool does.</p>

            <section class="tool-input">
                <label for="input">Input:</label>
                <textarea id="input" placeholder="Enter your input here..."></textarea>
            </section>

            <div class="button-group">
                <button id="processBtn">Process</button>
                <button id="copyBtn" class="secondary">Copy Result</button>
            </div>

            <div id="error" class="error" role="alert"></div>

            <section id="output" class="output">
                <div class="output-label">Result:</div>
                <pre id="result"></pre>
            </section>
        </article>
    </main>

    <footer class="site-footer">
        <a href="https://github.com/noahkiss/tools">View on GitHub</a>
    </footer>

    <script>
        // ===== Theme Toggle =====
        const themeToggle = document.getElementById('themeToggle');
        const html = document.documentElement;

        // Load saved theme or use system preference
        const savedTheme = localStorage.getItem('theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (systemDark ? 'dark' : 'light');
        html.setAttribute('data-theme', initialTheme);
        themeToggle.textContent = initialTheme === 'dark' ? '☀️' : '🌙';

        themeToggle.addEventListener('click', () => {
            const current = html.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
        });

        // ===== Tool Logic =====
        const input = document.getElementById('input');
        const output = document.getElementById('output');
        const result = document.getElementById('result');
        const error = document.getElementById('error');
        const processBtn = document.getElementById('processBtn');
        const copyBtn = document.getElementById('copyBtn');

        function showError(msg) {
            error.textContent = msg;
            error.classList.add('visible');
            output.classList.remove('visible');
        }

        function hideError() {
            error.classList.remove('visible');
        }

        function process() {
            hideError();
            const value = input.value.trim();

            if (!value) {
                showError('Please enter some input');
                return;
            }

            try {
                // TODO: Replace with actual processing logic
                const processed = value.toUpperCase();

                result.textContent = processed;
                output.classList.add('visible');
            } catch (e) {
                showError('Error: ' + e.message);
            }
        }

        processBtn.addEventListener('click', process);

        copyBtn.addEventListener('click', () => {
            if (!result.textContent) return;

            navigator.clipboard.writeText(result.textContent).then(() => {
                const original = copyBtn.textContent;
                copyBtn.textContent = 'Copied!';
                setTimeout(() => copyBtn.textContent = original, 2000);
            });
        });

        // Optional: real-time processing
        // input.addEventListener('input', process);
    </script>
</body>
</html>
```

---

## Commit Messages

When creating or updating tools, use descriptive commit messages:

- `Add json-formatter tool` - for new tools
- `Fix edge case in json-formatter when input is empty` - for bug fixes
- `Improve mobile layout for color-picker` - for improvements

Include a link to any relevant conversation transcript if the tool was created via LLM assistance.
