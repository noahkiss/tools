/**
 * Auto-injected footer for Noah's Tools
 * Include this script at the end of any tool to add consistent navigation.
 *
 * Usage: <script src="footer.js"></script>
 */

(function() {
    // Parse the URL to determine tool path
    const pathname = window.location.pathname;
    const parts = pathname.split('/').filter(Boolean);

    // Determine if this is folder-based or legacy flat file
    // Folder: /tools/jiradown/ or /tools/jiradown/index.html -> toolSlug = "jiradown"
    // Legacy: /tools/json-formatter.html -> toolSlug = "json-formatter"
    let toolSlug = '';
    let isFolder = false;

    if (parts.length === 0) {
        return; // Root index, skip
    }

    const lastPart = parts[parts.length - 1];

    if (lastPart === 'index.html' || lastPart === '') {
        // Folder-based tool: use the directory name
        toolSlug = parts[parts.length - 2] || parts[parts.length - 1];
        isFolder = true;
    } else if (lastPart.endsWith('.html')) {
        // Legacy flat file
        toolSlug = lastPart.replace('.html', '');
        isFolder = false;
    } else {
        // Folder without trailing slash or index.html
        toolSlug = lastPart;
        isFolder = true;
    }

    // Don't add footer to main index
    if (toolSlug === 'tools' || toolSlug === 'index' || toolSlug === '') {
        return;
    }

    // Get theme colors from CSS variables or fall back to defaults
    const getColor = (varName, fallback) => {
        const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        return value || fallback;
    };

    // Create footer element
    const footer = document.createElement('footer');
    footer.className = 'auto-footer';

    // Inject styles if not already present
    if (!document.querySelector('style[data-footer-styles]')) {
        const style = document.createElement('style');
        style.setAttribute('data-footer-styles', 'true');
        style.textContent = `
            .auto-footer {
                text-align: center;
                padding: 24px 20px;
                margin-top: 48px;
                border-top: 1px solid var(--color-border, #dee2e6);
                font-size: 14px;
            }

            .auto-footer nav {
                display: flex;
                justify-content: center;
                gap: 24px;
                flex-wrap: wrap;
            }

            .auto-footer a {
                color: var(--color-primary, #4a90e2);
                text-decoration: none;
                transition: opacity 0.2s;
            }

            .auto-footer a:hover {
                text-decoration: underline;
            }

            [data-theme="dark"] .auto-footer {
                border-color: var(--color-border, #3d3d5c);
            }

            @media (max-width: 480px) {
                .auto-footer nav {
                    flex-direction: column;
                    gap: 12px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Build GitHub URLs based on tool structure
    const githubBase = 'https://github.com/noahkiss/tools';
    const sourcePath = isFolder ? toolSlug : `${toolSlug}.html`;
    const sourceUrl = `${githubBase}/tree/main/${sourcePath}`;
    const historyUrl = `${githubBase}/commits/main/${sourcePath}`;

    footer.innerHTML = `
        <nav>
            <a href="/">← Home</a>
            <a href="${sourceUrl}">View Source</a>
            <a href="${historyUrl}">History</a>
        </nav>
    `;

    // Insert footer at end of body
    document.body.appendChild(footer);
})();
