/**
 * Auto-injected footer for Noah's Tools
 * Include this script at the end of any tool to add consistent navigation.
 *
 * Usage: <script src="footer.js"></script>
 */

(function() {
    // Get current filename
    const pathname = window.location.pathname;
    const filename = pathname.split('/').pop() || 'index.html';
    const toolName = filename.replace('.html', '');

    // Don't add footer to index page (it has its own)
    if (toolName === 'index' || toolName === '') {
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

    footer.innerHTML = `
        <nav>
            <a href="/">← Home</a>
            <a href="https://github.com/noahkiss/tools/blob/main/${filename}">View Source</a>
            <a href="https://github.com/noahkiss/tools/commits/main/${filename}">History</a>
        </nav>
    `;

    // Insert footer at end of body
    document.body.appendChild(footer);
})();
