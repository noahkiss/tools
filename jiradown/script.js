// ===== Reference Toggle =====
const reference = document.getElementById('reference');
reference.querySelector('h2').addEventListener('click', () => {
    reference.classList.toggle('open');
});

// ===== Conversion Functions =====

function jiraToMarkdown(jira) {
    if (!jira) return '';
    let text = jira;

    // Preserve code blocks first
    const codeBlocks = [];
    text = text.replace(/\{code(?::([a-zA-Z0-9_+-]+))?(?:[:|](?:title|borderStyle|borderColor|bgColor|titleBGColor|titleColor)=[^}|]+)*\}([\s\S]*?)\{code\}/gi, (match, lang, code) => {
        codeBlocks.push({ lang: lang || '', code: code });
        return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });

    // Preserve noformat blocks
    const noformatBlocks = [];
    text = text.replace(/\{noformat\}([\s\S]*?)\{noformat\}/gi, (match, content) => {
        noformatBlocks.push(content);
        return `__NOFORMAT_BLOCK_${noformatBlocks.length - 1}__`;
    });

    // Headings: h1. to h6.
    const headings = [];
    text = text.replace(/^h([1-6])\.\s*(.+)$/gm, (match, level, content) => {
        headings.push({ level: parseInt(level), content: content.trim() });
        return `__HEADING_${headings.length - 1}__`;
    });

    // Bold+Italic combo: *_text_* -> ***text***
    text = text.replace(/\*_([^_]+)_\*/g, '***$1***');
    text = text.replace(/_\*([^*]+)\*_/g, '***$1***');

    // Bold: *text* -> **text**
    text = text.replace(/(?<![a-zA-Z0-9*])\*([^\s*](?:[^*]*[^\s*])?)\*(?![a-zA-Z0-9*])/g, '**$1**');

    // Italic: _text_ -> *text*
    text = text.replace(/(?<![a-zA-Z0-9_])_([^\s_](?:[^_]*[^\s_])?)_(?![a-zA-Z0-9_])/g, '*$1*');

    // Strikethrough: -text- -> ~~text~~
    text = text.replace(/(?<![a-zA-Z0-9-])-([^\s-][^-]*[^\s-]|[^\s-])-(?![a-zA-Z0-9-])/g, '~~$1~~');

    // Underline: +text+ -> <ins>text</ins>
    text = text.replace(/(?<![a-zA-Z0-9+])\+([^\s+][^+]*[^\s+]|[^\s+])\+(?![a-zA-Z0-9+])/g, '<ins>$1</ins>');

    // Superscript: ^text^ -> <sup>text</sup>
    text = text.replace(/\^([^^]+)\^/g, '<sup>$1</sup>');

    // Subscript: ~text~ -> <sub>text</sub>
    text = text.replace(/(?<!~)~([^~]+)~(?!~)/g, '<sub>$1</sub>');

    // Monospace: {{text}} -> `text`
    text = text.replace(/\{\{([^}]+)\}\}/g, '`$1`');

    // Named links: [text|url] -> [text](url)
    text = text.replace(/\[([^\]|]+)\|([^\]]+)\]/g, '[$1]($2)');

    // Unnamed links: [url] -> <url> or [url](url)
    text = text.replace(/\[([^\]|]+)\]/g, (match, content) => {
        if (content.match(/^https?:\/\//)) {
            return `<${content}>`;
        }
        return match;
    });

    // Images: !url! or !url|params! -> ![alt](url)
    text = text.replace(/!([^!\s|]+)(?:\|([^!]+))?!/g, (match, src, params) => {
        let alt = '';
        if (params) {
            const altMatch = params.match(/alt=([^,|]+)/);
            if (altMatch) alt = altMatch[1];
        }
        return `![${alt}](${src})`;
    });

    // Bullet lists with nesting
    text = text.replace(/^(\*+)\s+(.+)$/gm, (match, stars, content) => {
        const indent = '  '.repeat(stars.length - 1);
        return `${indent}- ${content}`;
    });

    // Numbered lists with nesting
    text = text.replace(/^(#+)\s+(.+)$/gm, (match, hashes, content) => {
        const indent = '  '.repeat(hashes.length - 1);
        return `${indent}1. ${content}`;
    });

    // Blockquote: bq. text -> > text
    text = text.replace(/^bq\.\s*(.+)$/gm, '> $1');

    // Quote blocks: {quote}...{quote}
    text = text.replace(/\{quote\}([\s\S]*?)\{quote\}/gi, (match, content) => {
        return content.trim().split('\n').map(line => `> ${line}`).join('\n');
    });

    // Panels: {panel:title=X}...{panel}
    text = text.replace(/\{panel(?::title=([^}|]+))?(?:\|[^}]*)?\}([\s\S]*?)\{panel\}/gi, (match, title, content) => {
        const lines = content.trim().split('\n').map(line => `> ${line}`);
        if (title) {
            lines.unshift(`> **${title}**`, '>');
        }
        return lines.join('\n');
    });

    // Color tags: {color:red}text{color} -> text (strip colors)
    text = text.replace(/\{color:[^}]+\}([\s\S]*?)\{color\}/gi, '$1');

    // Tables
    text = text.replace(/((?:^[\t ]*\|.+\|[\t ]*$\n?)+)/gm, (tableBlock) => {
        const lines = tableBlock.trim().split('\n');
        const processedLines = [];
        let needsSeparator = false;
        let colCount = 0;

        for (const line of lines) {
            const trimmedLine = line.trim();
            // Header row: ||col||col||
            if (trimmedLine.includes('||')) {
                const cells = trimmedLine.split('||').filter(c => c !== '');
                colCount = cells.length;
                processedLines.push('| ' + cells.map(c => c.trim()).join(' | ') + ' |');
                needsSeparator = true;
            }
            // Regular row: |col|col|
            else if (trimmedLine.match(/^\|[^|]/)) {
                if (needsSeparator && processedLines.length > 0) {
                    processedLines.push('|' + ' --- |'.repeat(colCount));
                    needsSeparator = false;
                }
                const cells = trimmedLine.split('|').filter((c, i, arr) => i > 0 && i < arr.length - 1);
                processedLines.push('| ' + cells.map(c => c.trim()).join(' | ') + ' |');
            }
        }

        // If only header rows with no data, still add separator
        if (needsSeparator && processedLines.length > 0) {
            processedLines.push('|' + ' --- |'.repeat(colCount));
        }

        return processedLines.join('\n');
    });

    // Horizontal rule: ---- -> ---
    text = text.replace(/^-{4,}$/gm, '---');

    // Line breaks: \\ -> two trailing spaces + newline
    text = text.replace(/\\\\/g, '  \n');

    // Anchors and TOC: remove
    text = text.replace(/\{anchor:[^}]+\}/gi, '');
    text = text.replace(/\{toc(?::[^}]*)?\}/gi, '');

    // User mentions: [~username] -> @username
    text = text.replace(/\[~([^\]]+)\]/g, '@$1');

    // Restore headings
    headings.forEach((h, i) => {
        text = text.replace(`__HEADING_${i}__`, '#'.repeat(h.level) + ' ' + h.content);
    });

    // Restore code blocks
    codeBlocks.forEach((block, i) => {
        text = text.replace(`__CODE_BLOCK_${i}__`, '```' + block.lang + '\n' + block.code.trim() + '\n```');
    });

    // Restore noformat blocks
    noformatBlocks.forEach((content, i) => {
        text = text.replace(`__NOFORMAT_BLOCK_${i}__`, '```\n' + content.trim() + '\n```');
    });

    // Unescape curly braces (Jira uses \{ and \} for literals, Markdown doesn't need escaping)
    text = text.replace(/\\([{}])/g, '$1');

    return text;
}

function markdownToJira(md) {
    if (!md) return '';
    let text = md;

    // Preserve code blocks first
    const codeBlocks = [];
    text = text.replace(/```([a-zA-Z0-9_+-]*)\n?([\s\S]*?)```/g, (match, lang, code) => {
        codeBlocks.push({ lang: lang || '', code: code });
        return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });

    // Preserve inline code
    const inlineCodes = [];
    text = text.replace(/`([^`]+)`/g, (match, code) => {
        inlineCodes.push(code);
        return `__INLINE_CODE_${inlineCodes.length - 1}__`;
    });

    // Headers: # to ###### -> h1. to h6.
    text = text.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, content) => {
        return `h${hashes.length}. ${content}`;
    });

    // Bold+Italic: ***text*** -> *_text_*
    text = text.replace(/\*{3}([^*]+)\*{3}/g, '*_$1_*');

    // Bold: **text** -> *text* (use placeholder to avoid italic match)
    const boldMatches = [];
    text = text.replace(/\*{2}([^*]+)\*{2}/g, (match, content) => {
        boldMatches.push(content);
        return `__BOLD_${boldMatches.length - 1}__`;
    });

    // Italic: *text* -> _text_
    text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '_$1_');

    // Restore bold
    boldMatches.forEach((content, i) => {
        text = text.replace(`__BOLD_${i}__`, `*${content}*`);
    });

    // Strikethrough: ~~text~~ -> -text-
    text = text.replace(/~~([^~]+)~~/g, '-$1-');

    // HTML tags
    text = text.replace(/<ins>([^<]+)<\/ins>/gi, '+$1+');
    text = text.replace(/<sup>([^<]+)<\/sup>/gi, '^$1^');
    text = text.replace(/<sub>([^<]+)<\/sub>/gi, '~$1~');

    // Links: [text](url) -> [text|url]
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '[$1|$2]');

    // Unnamed links: <url> -> [url]
    text = text.replace(/<(https?:\/\/[^>]+)>/g, '[$1]');

    // Images: ![alt](url) -> !url|alt=alt!
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
        if (alt) {
            return `!${src}|alt=${alt}!`;
        }
        return `!${src}!`;
    });

    // Tables - detect and convert
    text = text.replace(/((?:^\|.+\|$\n?)+)/gm, (tableBlock) => {
        const lines = tableBlock.trim().split('\n');
        const processedLines = [];
        let isFirstRow = true;

        for (const line of lines) {
            // Skip separator rows
            if (line.match(/^\|\s*[-:]+\s*\|/)) continue;

            const cells = line.split('|').filter((c, i, arr) => i > 0 && i < arr.length - 1);

            if (isFirstRow) {
                // Header row
                processedLines.push('||' + cells.map(c => c.trim()).join('||') + '||');
                isFirstRow = false;
            } else {
                // Data row
                processedLines.push('|' + cells.map(c => c.trim()).join('|') + '|');
            }
        }

        return processedLines.join('\n');
    });

    // Blockquotes: > text -> {quote}...{quote} for multiline, bq. for single
    text = text.replace(/((?:^>.*$\n?)+)/gm, (quoteBlock) => {
        const lines = quoteBlock.trim().split('\n').map(l => l.replace(/^>\s?/, ''));
        if (lines.length === 1) {
            return `bq. ${lines[0]}`;
        }
        return `{quote}\n${lines.join('\n')}\n{quote}`;
    });

    // Unordered lists with nesting
    text = text.replace(/^((?:  )*)[-*]\s+(.+)$/gm, (match, indent, content) => {
        const level = (indent.length / 2) + 1;
        return '*'.repeat(level) + ' ' + content;
    });

    // Ordered lists with nesting
    text = text.replace(/^((?:  )*)\d+\.\s+(.+)$/gm, (match, indent, content) => {
        const level = (indent.length / 2) + 1;
        return '#'.repeat(level) + ' ' + content;
    });

    // Horizontal rule: --- -> ----
    text = text.replace(/^-{3,}$/gm, '----');

    // User mentions: @username -> [~username]
    text = text.replace(/@([a-zA-Z0-9_.-]+)/g, '[~$1]');

    // Restore inline code: `code` -> {{code}}
    inlineCodes.forEach((code, i) => {
        text = text.replace(`__INLINE_CODE_${i}__`, `{{${code}}}`);
    });

    // Restore code blocks
    codeBlocks.forEach((block, i) => {
        if (block.lang) {
            text = text.replace(`__CODE_BLOCK_${i}__`, `{code:${block.lang}}\n${block.code.trim()}\n{code}`);
        } else {
            text = text.replace(`__CODE_BLOCK_${i}__`, `{code}\n${block.code.trim()}\n{code}`);
        }
    });

    return text;
}

// ===== UI State =====
const jiraInput = document.getElementById('jiraInput');
const mdInput = document.getElementById('mdInput');
const jiraPane = document.getElementById('jiraPane');
const mdPane = document.getElementById('mdPane');

let isConverting = false;
let activePane = null;

function setActivePane(pane) {
    activePane = pane;
    jiraPane.classList.toggle('active', pane === 'jira');
    mdPane.classList.toggle('active', pane === 'md');
}

jiraInput.addEventListener('input', () => {
    if (isConverting) return;
    setActivePane('jira');
    isConverting = true;
    mdInput.value = jiraToMarkdown(jiraInput.value);
    isConverting = false;
});

mdInput.addEventListener('input', () => {
    if (isConverting) return;
    setActivePane('md');
    isConverting = true;
    jiraInput.value = markdownToJira(mdInput.value);
    isConverting = false;
});

jiraInput.addEventListener('focus', () => setActivePane('jira'));
mdInput.addEventListener('focus', () => setActivePane('md'));

// Copy buttons
function copyWithFeedback(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const original = button.textContent;
        button.textContent = 'Copied!';
        button.classList.add('copied');
        setTimeout(() => {
            button.textContent = original;
            button.classList.remove('copied');
        }, 2000);
    });
}

document.getElementById('copyJiraBtn').addEventListener('click', () => {
    copyWithFeedback(jiraInput.value, document.getElementById('copyJiraBtn'));
});

document.getElementById('copyMdBtn').addEventListener('click', () => {
    copyWithFeedback(mdInput.value, document.getElementById('copyMdBtn'));
});

// Clear buttons
document.getElementById('clearJiraBtn').addEventListener('click', () => {
    jiraInput.value = '';
    mdInput.value = '';
    jiraInput.focus();
});

document.getElementById('clearMdBtn').addEventListener('click', () => {
    jiraInput.value = '';
    mdInput.value = '';
    mdInput.focus();
});
