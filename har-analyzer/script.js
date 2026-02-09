// ===== State =====
let rawHar = null;
let fileName = '';

// Resource types and their default enabled state
const RESOURCE_TYPES = {
    fetch: true,
    xhr: true,
    xmlhttprequest: true,
    document: true,
    script: false,
    stylesheet: false,
    image: false,
    font: false,
    media: false,
    websocket: false,
    manifest: false,
    other: false,
};

// Browser-internal headers to hide by default
const NOISE_HEADERS = new Set([
    'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform', 'sec-ch-ua-full-version-list',
    'sec-ch-ua-arch', 'sec-ch-ua-bitness', 'sec-ch-ua-model', 'sec-ch-ua-wow64',
    'sec-fetch-dest', 'sec-fetch-mode', 'sec-fetch-site', 'sec-fetch-user',
    'upgrade-insecure-requests', 'dnt', 'connection', 'host',
    'accept-encoding', 'accept-language',
]);

// ===== DOM Refs =====
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const uploadSection = document.getElementById('uploadSection');
const resultsSection = document.getElementById('resultsSection');
const statsEl = document.getElementById('stats');
const errorEl = document.getElementById('error');
const yamlOutput = document.getElementById('yamlOutput');
const mermaidOutput = document.getElementById('mermaidOutput');
const requestsList = document.getElementById('requestsList');
const resourceTypeFilters = document.getElementById('resourceTypeFilters');
const excludePatterns = document.getElementById('excludePatterns');
const showAllHeaders = document.getElementById('showAllHeaders');

// ===== Init =====
mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });

buildResourceTypeCheckboxes();
setupEventListeners();

// ===== File Upload =====
function setupEventListeners() {
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', e => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
    dropzone.addEventListener('drop', e => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', e => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });

    document.getElementById('newFileBtn').addEventListener('click', resetUI);
    document.getElementById('copyYamlBtn').addEventListener('click', copyYaml);
    document.getElementById('downloadYamlBtn').addEventListener('click', downloadYaml);

    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Re-process on filter change
    resourceTypeFilters.addEventListener('change', reprocess);
    excludePatterns.addEventListener('input', debounce(reprocess, 300));
    showAllHeaders.addEventListener('change', reprocess);
}

function handleFile(file) {
    if (!file.name.endsWith('.har')) {
        showError('Please upload a .har file');
        return;
    }
    hideError();
    fileName = file.name;

    const reader = new FileReader();
    reader.onload = e => {
        try {
            rawHar = JSON.parse(e.target.result);
            if (!rawHar.log || !Array.isArray(rawHar.log.entries)) {
                throw new Error('Invalid HAR format: missing log.entries');
            }
            process();
        } catch (err) {
            showError(`Failed to parse HAR: ${err.message}`);
        }
    };
    reader.readAsText(file);
}

// ===== Processing Pipeline =====
function process() {
    const entries = rawHar.log.entries;
    const enabledTypes = getEnabledTypes();
    const excludes = getExcludePatterns();
    const allHeaders = showAllHeaders.checked;

    // Filter
    const filtered = entries.filter(entry => {
        const type = (entry._resourceType || guessResourceType(entry)).toLowerCase();
        if (!enabledTypes.has(type)) return false;
        const url = entry.request.url;
        return !excludes.some(p => url.includes(p));
    });

    // Sort by time
    filtered.sort((a, b) => new Date(a.startedDateTime) - new Date(b.startedDateTime));

    // Parse entries
    const requests = filtered.map((entry, i) => parseEntry(entry, i, allHeaders));

    // Detect dependencies
    const deps = detectDependencies(requests);

    // Update stats
    statsEl.innerHTML = `<strong>${requests.length}</strong> requests from <strong>${entries.length}</strong> entries &middot; <strong>${deps.length}</strong> dependencies detected &middot; <em>${fileName}</em>`;

    // Generate outputs
    const yaml = generateYaml(requests, deps);
    yamlOutput.textContent = yaml;

    renderMermaid(requests, deps);
    renderRequestsList(requests, deps);

    // Show results
    uploadSection.hidden = true;
    resultsSection.hidden = false;
}

function reprocess() {
    if (rawHar) process();
}

// ===== Entry Parsing =====
function parseEntry(entry, index, allHeaders) {
    const req = entry.request;
    const res = entry.response;
    const urlObj = new URL(req.url);

    // Filter headers
    const headers = {};
    for (const h of req.headers) {
        const name = h.name.toLowerCase();
        if (!allHeaders && NOISE_HEADERS.has(name)) continue;
        headers[h.name] = h.value;
    }

    // Response headers
    const resHeaders = {};
    for (const h of res.headers) {
        const name = h.name.toLowerCase();
        if (!allHeaders && NOISE_HEADERS.has(name)) continue;
        resHeaders[h.name] = h.value;
    }

    // Parse body
    let body = null;
    if (req.postData && req.postData.text) {
        body = tryParseJson(req.postData.text) || req.postData.text;
    }

    // Parse response body
    let responseBody = null;
    if (res.content && res.content.text) {
        responseBody = tryParseJson(res.content.text);
        // Keep as string if not JSON but not too large
        if (!responseBody && res.content.text.length < 5000) {
            responseBody = res.content.text;
        }
    }

    const path = urlObj.pathname + (urlObj.search || '');
    const name = `${req.method} ${urlObj.pathname}`;

    return {
        index,
        name,
        method: req.method,
        url: req.url,
        host: urlObj.host,
        path,
        headers,
        body,
        response: {
            status: res.status,
            statusText: res.statusText,
            contentType: res.content ? res.content.mimeType : '',
            headers: resHeaders,
            body: responseBody,
        },
        time: entry.startedDateTime,
        resourceType: entry._resourceType || guessResourceType(entry),
    };
}

function guessResourceType(entry) {
    const url = entry.request.url.toLowerCase();
    const mime = (entry.response.content && entry.response.content.mimeType) || '';
    if (mime.includes('html')) return 'document';
    if (mime.includes('javascript')) return 'script';
    if (mime.includes('css')) return 'stylesheet';
    if (mime.includes('image')) return 'image';
    if (mime.includes('font')) return 'font';
    if (mime.includes('json') || mime.includes('xml')) return 'fetch';
    if (url.match(/\.(js|mjs)(\?|$)/)) return 'script';
    if (url.match(/\.css(\?|$)/)) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)(\?|$)/)) return 'image';
    if (url.match(/\.(woff2?|ttf|otf|eot)(\?|$)/)) return 'font';
    return 'other';
}

// ===== Dependency Detection =====
function detectDependencies(requests) {
    // Build a map of response values → source request
    const valueMap = new Map(); // value → { reqIndex, path }
    const deps = [];

    for (let i = 0; i < requests.length; i++) {
        const req = requests[i];
        const resBody = req.response.body;

        // Check this request against previously indexed values
        if (i > 0) {
            const found = findDepsInRequest(req, valueMap);
            for (const dep of found) {
                deps.push({ from: dep.sourceIndex, to: i, via: dep.path, value: dep.matchedValue });
            }
        }

        // Index this response's values
        if (resBody && typeof resBody === 'object') {
            indexValues(resBody, i, '', valueMap);
        }
    }

    return deps;
}

function indexValues(obj, reqIndex, prefix, map) {
    if (Array.isArray(obj)) {
        obj.forEach((item, i) => indexValues(item, reqIndex, `${prefix}[${i}]`, map));
        return;
    }
    if (obj && typeof obj === 'object') {
        for (const [key, val] of Object.entries(obj)) {
            indexValues(val, reqIndex, prefix ? `${prefix}.${key}` : key, map);
        }
        return;
    }
    // Leaf value - index strings > 8 chars, < 1000 chars
    if (typeof obj === 'string' && obj.length > 8 && obj.length < 1000) {
        // Skip values that look like timestamps, common strings, or URIs that are just URLs
        if (/^\d{4}-\d{2}-\d{2}/.test(obj)) return;
        if (/^https?:\/\//.test(obj)) return;
        map.set(obj, { reqIndex, path: prefix });
    }
}

function findDepsInRequest(req, valueMap) {
    const found = [];
    const seen = new Set(); // avoid duplicate deps to same source

    function checkValue(val) {
        if (typeof val !== 'string' || val.length <= 8) return;
        // Check for exact match
        const match = valueMap.get(val);
        if (match && !seen.has(match.reqIndex)) {
            seen.add(match.reqIndex);
            found.push({ sourceIndex: match.reqIndex, path: match.path, matchedValue: val });
            return;
        }
        // Check for substring match (e.g., "Bearer <token>")
        for (const [mapVal, source] of valueMap) {
            if (val.includes(mapVal) && !seen.has(source.reqIndex)) {
                seen.add(source.reqIndex);
                found.push({ sourceIndex: source.reqIndex, path: source.path, matchedValue: mapVal });
            }
        }
    }

    // Check headers
    for (const val of Object.values(req.headers)) {
        checkValue(val);
    }

    // Check URL
    checkValue(req.url);

    // Check body
    if (req.body) {
        if (typeof req.body === 'string') {
            checkValue(req.body);
        } else {
            walkValues(req.body, checkValue);
        }
    }

    return found;
}

function walkValues(obj, fn) {
    if (Array.isArray(obj)) {
        obj.forEach(item => walkValues(item, fn));
    } else if (obj && typeof obj === 'object') {
        Object.values(obj).forEach(val => walkValues(val, fn));
    } else if (typeof obj === 'string') {
        fn(obj);
    }
}

// ===== YAML Generation =====
function generateYaml(requests, deps) {
    // Build dep lookup: toIndex → [fromIndex]
    const depLookup = {};
    const depDetail = {};
    for (const dep of deps) {
        if (!depLookup[dep.to]) depLookup[dep.to] = [];
        depLookup[dep.to].push(dep.from);
        depDetail[`${dep.from}->${dep.to}`] = dep.via;
    }

    const firstTime = requests.length > 0 ? requests[0].time : '';

    const flow = requests.map(req => {
        const entry = {
            name: req.name,
            method: req.method,
            url: req.url,
        };

        // Only include non-empty headers
        if (Object.keys(req.headers).length > 0) {
            entry.headers = req.headers;
        }

        if (req.body) {
            entry.body = req.body;
        }

        entry.response = {
            status: req.response.status,
            content_type: req.response.contentType || undefined,
        };

        // Dependencies
        if (depLookup[req.index]) {
            entry.depends_on = depLookup[req.index].map(fromIdx => {
                const source = requests.find(r => r.index === fromIdx);
                const via = depDetail[`${fromIdx}->${req.index}`];
                return `${source.name} (via ${via})`;
            });
        }

        return entry;
    });

    const header = [
        `# HAR Flow Analysis`,
        `# Source: ${fileName}`,
        `# Captured: ${firstTime}`,
        `# Requests: ${requests.length} of ${rawHar.log.entries.length} entries`,
        '',
    ].join('\n');

    return header + jsyaml.dump({ flow }, {
        indent: 2,
        lineWidth: 120,
        noRefs: true,
        quotingType: '"',
        forceQuotes: false,
    });
}

// ===== Mermaid Diagram =====
async function renderMermaid(requests, deps) {
    if (requests.length === 0) {
        mermaidOutput.innerHTML = '<p style="color:var(--color-text-muted)">No requests to diagram</p>';
        return;
    }

    // Limit diagram to avoid overwhelming mermaid
    const maxNodes = 50;
    const diagramRequests = requests.slice(0, maxNodes);
    const truncated = requests.length > maxNodes;

    let graph = 'flowchart TD\n';
    graph += '    Start([Start])\n';

    // Build nodes
    for (const req of diagramRequests) {
        const id = `R${req.index}`;
        const label = `${req.method} ${truncatePath(req.path, 40)}`;
        const status = req.response.status;
        graph += `    ${id}["${escMermaid(label)}<br/>${status}"]\n`;

        // Style by status
        if (status >= 400) {
            graph += `    style ${id} fill:#f8d7da,stroke:#dc3545,color:#721c24\n`;
        } else if (status >= 300) {
            graph += `    style ${id} fill:#fff3cd,stroke:#ffc107,color:#856404\n`;
        }
    }

    // Build edges
    const hasIncoming = new Set();
    for (const dep of deps) {
        if (dep.to >= maxNodes || dep.from >= maxNodes) continue;
        hasIncoming.add(dep.to);
        const label = dep.via.split('.').pop(); // just the last key
        graph += `    R${dep.from} -->|${escMermaid(label)}| R${dep.to}\n`;
    }

    // Connect unlinked nodes to Start
    for (const req of diagramRequests) {
        if (!hasIncoming.has(req.index)) {
            graph += `    Start --> R${req.index}\n`;
        }
    }

    if (truncated) {
        graph += `    More["... and ${requests.length - maxNodes} more"]\n`;
        graph += `    style More fill:var(--color-bg),stroke:var(--color-border),color:var(--color-text-muted)\n`;
    }

    try {
        const { svg } = await mermaid.render('mermaid-graph', graph);
        mermaidOutput.innerHTML = svg;
    } catch (err) {
        mermaidOutput.innerHTML = `<pre style="text-align:left;font-size:12px;color:var(--color-error)">${escHtml(err.message)}</pre><pre style="text-align:left;font-size:11px;color:var(--color-text-muted)">${escHtml(graph)}</pre>`;
    }
}

// ===== Requests List =====
function renderRequestsList(requests, deps) {
    // Build dep lookup
    const depsByTo = {};
    for (const dep of deps) {
        if (!depsByTo[dep.to]) depsByTo[dep.to] = [];
        depsByTo[dep.to].push(dep);
    }

    requestsList.innerHTML = requests.map(req => {
        const methodClass = `method-${req.method}`;
        const statusClass = `status-${Math.floor(req.response.status / 100)}xx`;
        const reqDeps = depsByTo[req.index] || [];
        const depTags = reqDeps.map(d => {
            const source = requests.find(r => r.index === d.from);
            return `<span class="dep-tag">depends on ${escHtml(source.name)}</span>`;
        }).join('');

        let details = '';

        // URL
        details += detailSection('URL', req.url);

        // Headers
        if (Object.keys(req.headers).length > 0) {
            details += detailSection('Request Headers', formatObj(req.headers));
        }

        // Body
        if (req.body) {
            const bodyStr = typeof req.body === 'object' ? JSON.stringify(req.body, null, 2) : req.body;
            details += detailSection('Request Body', bodyStr);
        }

        // Response headers
        if (Object.keys(req.response.headers).length > 0) {
            details += detailSection('Response Headers', formatObj(req.response.headers));
        }

        // Response body
        if (req.response.body) {
            const bodyStr = typeof req.response.body === 'object'
                ? JSON.stringify(req.response.body, null, 2)
                : req.response.body;
            const truncated = bodyStr.length > 5000;
            details += detailSection(
                'Response Body' + (truncated ? ' (truncated)' : ''),
                truncated ? bodyStr.slice(0, 5000) + '\n...' : bodyStr
            );
        }

        return `<details class="request-card">
            <summary>
                <span class="method-badge ${methodClass}">${req.method}</span>
                <span class="status-badge ${statusClass}">${req.response.status}</span>
                <span class="request-path">${escHtml(req.path)}</span>
                ${depTags}
            </summary>
            <div class="request-detail">${details}</div>
        </details>`;
    }).join('');
}

function detailSection(title, content) {
    return `<div class="detail-section"><h4>${escHtml(title)}</h4><pre>${escHtml(content)}</pre></div>`;
}

function formatObj(obj) {
    return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join('\n');
}

// ===== Filter Controls =====
function buildResourceTypeCheckboxes() {
    resourceTypeFilters.innerHTML = Object.entries(RESOURCE_TYPES).map(([type, checked]) => {
        // Normalize display names
        const display = type === 'xmlhttprequest' ? 'XHR' : type.charAt(0).toUpperCase() + type.slice(1);
        return `<label class="checkbox-label">
            <input type="checkbox" value="${type}" ${checked ? 'checked' : ''}>
            ${display}
        </label>`;
    }).join('');
}

function getEnabledTypes() {
    const types = new Set();
    resourceTypeFilters.querySelectorAll('input:checked').forEach(cb => types.add(cb.value));
    return types;
}

function getExcludePatterns() {
    return excludePatterns.value
        .split('\n')
        .map(p => p.trim())
        .filter(Boolean);
}

// ===== Tab Switching =====
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
    document.getElementById('yamlTab').hidden = tabName !== 'yaml';
    document.getElementById('diagramTab').hidden = tabName !== 'diagram';
    document.getElementById('requestsTab').hidden = tabName !== 'requests';
}

// ===== Actions =====
function copyYaml() {
    const btn = document.getElementById('copyYamlBtn');
    navigator.clipboard.writeText(yamlOutput.textContent).then(() => {
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 2000);
    });
}

function downloadYaml() {
    const blob = new Blob([yamlOutput.textContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace('.har', '') + '-flow.yaml';
    a.click();
    URL.revokeObjectURL(url);
}

function resetUI() {
    rawHar = null;
    fileName = '';
    uploadSection.hidden = false;
    resultsSection.hidden = true;
    fileInput.value = '';
    hideError();
}

// ===== Utilities =====
function tryParseJson(str) {
    try { return JSON.parse(str); } catch { return null; }
}

function escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escMermaid(str) {
    return str.replace(/"/g, '#quot;').replace(/[<>{}|]/g, ' ');
}

function truncatePath(path, max) {
    if (path.length <= max) return path;
    return '...' + path.slice(-(max - 3));
}

function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.add('visible');
}

function hideError() {
    errorEl.classList.remove('visible');
}

function debounce(fn, ms) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}
