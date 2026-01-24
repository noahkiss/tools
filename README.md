# tools

A collection of single-file HTML tools, built with the help of LLMs.

Each tool is a self-contained HTML file with inline CSS and JavaScript—no build step required. Host them anywhere, copy them anywhere, modify them easily.

View the live tools at: **https://noahkiss.github.io/tools/**

---

## Text & Data

- [Jiradown](https://noahkiss.github.io/tools/jiradown/) - Bidirectional Jira ↔ Markdown converter

## Image & Media

<!-- Add tools here as they're created -->

## Development

<!-- Add tools here as they're created -->

## Utilities

<!-- Add tools here as they're created -->

---

## About

This repository follows a philosophy of **single-file simplicity**:

- Every tool is one `.html` file
- No build step, no bundlers, no frameworks
- Dependencies loaded from CDNs when needed
- Tools are small enough for any LLM to read and modify

See [AGENTS.md](AGENTS.md) for instructions on creating new tools.

---

## Inspiration & Lessons Learned

This repo is inspired by [Simon Willison's tools collection](https://tools.simonwillison.net/) and his blog post [Building tools with HTML and JavaScript](https://simonwillison.net/2025/Dec/10/html-tools/).

**Key principles from Simon's approach:**

1. **Single-file simplicity** - One HTML file with inline CSS/JS means no build step, easy hosting, and you can copy/paste tools directly from LLM responses.

2. **No React** - Avoiding frameworks that require compilation keeps things simple. Vanilla JS is enough for most tools.

3. **CDN dependencies** - When you need a library (marked, tesseract.js, pdf.js, etc.), load it from jsdelivr or cdnjs. No npm required.

4. **Keep them small** - A few hundred lines means any LLM can read and understand the entire tool. Maintainability matters less when the code is simple enough to regenerate.

5. **URL state for sharing** - Store state in URL hashes so users can bookmark and share configurations.

6. **localStorage for preferences** - User settings like API keys and theme preferences persist via localStorage.

7. **Low stakes** - These are utilities, not production software. If something breaks, fix it or remake it.

**Tools used for building:**
- [Claude](https://claude.ai) / [Claude Code](https://claude.ai/claude-code) for generating tools
- GitHub Pages for hosting
- Playwright for testing (optional)
