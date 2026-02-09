---
name: venera-source-development
description: This skill should be used when the user wants to create a new Venera comic source, fix issues in existing sources, maintain or update source configurations, implement data fetching and parsing for manga/comic websites, add authentication or search functionality to sources, or troubleshoot network requests, HTML parsing, image loading, or rate limiting problems in Venera sources.
license: MIT
compatibility: opencode
metadata:
  version: "1.0"
  author: gdm257
---

# Learning Venera Source

Complete guide for creating, fixing, and maintaining Venera comic sources without reading the main codebase.

## Quick Start

### Minimal Source Template

```javascript
class MySource extends ComicSource {
    // ===== Required Properties =====
    name = "My Source"
    key = "my_source"
    version = "1.0.0"
    minAppVersion = "1.0.0"
    url = "https://example.com/sources/my_source.js"

    // ===== Core Methods =====

    // Get popular comics
    async getPopular(page) {
        const res = await Network.get(`https://api.example.com/popular?page=${page}`)
        const json = JSON.parse(res.body)
        return json.data.map(item => new Comic({
            id: item.id,
            title: item.title,
            cover: item.cover,
            subtitle: item.author
        }))
    }

    // Get latest comics
    async getLatest(page) {
        // Same pattern as getPopular
        return []
    }

    // Search comics
    async search(keyword, page, options) {
        const res = await Network.get(
            `https://api.example.com/search?q=${encodeURIComponent(keyword)}&page=${page}`
        )
        const json = JSON.parse(res.body)
        return json.data.map(item => new Comic({
            id: item.id,
            title: item.title,
            cover: item.cover
        }))
    }

    // Load comic details
    async loadInfo(id) {
        const res = await Network.get(`https://api.example.com/comic/${id}`)
        const data = JSON.parse(res.body)

        return new ComicDetails({
            title: data.title,
            cover: data.cover,
            description: data.description,
            tags: data.tags || {},
            chapters: data.chapters.map(ch => ({
                title: ch.title,
                id: ch.id
            }))
        })
    }

    // Load chapter images
    async loadEp(comicId, chapterId) {
        const res = await Network.get(
            `https://api.example.com/comic/${comicId}/chapter/${chapterId}`
        )
        const data = JSON.parse(res.body)
        return data.images  // Array of image URLs
    }
}
```

## Data Models

### Comic (List Item)

```javascript
new Comic({
    id: "string",           // Required: unique identifier
    title: "string",        // Required: comic title
    subtitle: "string",     // Optional: author/subtitle
    cover: "string",        // Optional: cover image URL
    tags: ["string"],       // Optional: tags array
    description: "string",  // Optional: brief description
    maxPage: 1,             // Optional: total pages
    language: "string",     // Optional: language code
    favoriteId: "string",   // Optional: favorite ID
    stars: 5                // Optional: rating (1-5)
})
```

### ComicDetails (Detail View)

```javascript
new ComicDetails({
    title: "string",        // Required
    subtitle: "string",     // Optional
    cover: "string",        // Optional
    description: "string",  // Optional
    tags: {                 // Optional: categorized tags
        "分类": ["冒险", "恋爱"],
        "作者": ["作者名"]
    },
    chapters: [             // Required if has chapters
        {
            title: "Chapter 1",
            id: "chapter_id",
            time: "2024-01-01",  // Optional
            page: 20              // Optional: page count
        }
    ],
    isFavorite: false,      // Optional
    subId: "string",        // Optional: sub identifier
    thumbnails: ["string"], // Optional: preview thumbnails
    recommend: [Comic],     // Optional: recommended comics
    commentCount: 0,        // Optional
    likesCount: 0,          // Optional
    isLiked: false,         // Optional
    uploader: "string",     // Optional
    updateTime: "string",   // Optional
    uploadTime: "string",   // Optional
    url: "string",          // Optional: source URL
    stars: 5,               // Optional
    maxPage: 1,             // Optional
    comments: [Comment]    // Optional
})
```

### Comment

```javascript
new Comment({
    userName: "string",
    avatar: "string",       // Avatar URL
    content: "string",
    time: "string",
    replyCount: 0,
    id: "string",
    isLiked: false,
    score: 5,               // Rating score
    voteStatus: "string"    // "up", "down", or null
})
```

## Network API

### Basic Methods

```javascript
// Generic request (returns text)
await Network.sendRequest(method, url, headers, data, extra)

// HTTP shortcuts
await Network.get(url, headers, extra)
await Network.post(url, headers, data, extra)
await Network.put(url, headers, data, extra)
await Network.patch(url, headers, data, extra)
await Network.delete(url, headers, extra)

// Binary data
await Network.fetchBytes(method, url, headers, data, extra)
```

### Request Parameters

- `method`: "GET", "POST", "PUT", "DELETE", "PATCH"
- `url`: Request URL
- `headers`: Object like `{"Content-Type": "application/json"}`
- `data`: String body or FormData
- `extra`: Options object:
  - `withCredentials`: Include cookies (boolean)
  - `responseType`: Response type ("text", "arraybuffer")

### Response Format

```javascript
{
    statusCode: 200,      // HTTP status code
    headers: {},          // Response headers
    body: "..."           // Response body (string or Uint8Array)
}
```

### FormData Usage

```javascript
const form = new FormData()
form.append("key", "value")
form.appendFile("file", "filename.jpg", uint8ArrayData)

const res = await Network.post("https://api.example.com/upload", {}, form)
```

## Encoding & Crypto API

### Text Encoding

```javascript
Convert.encodeUtf8(str)      // string → Uint8Array
Convert.decodeUtf8(buffer)   // Uint8Array → string
```

### Base64

```javascript
Convert.encodeBase64(buffer)   // Uint8Array → base64 string
Convert.decodeBase64(str)    // base64 string → Uint8Array
```

### Hash (MD5, SHA)

```javascript
Convert.md5(buffer)        // Returns Uint8Array
Convert.sha1(buffer)
Convert.sha256(buffer)
Convert.sha512(buffer)
```

### AES Encryption

```javascript
// ECB Mode
Convert.encryptAesEcb(value, key)   // value: Uint8Array, key: string
Convert.decryptAesEcb(value, key)

// CBC Mode
Convert.encryptAesCbc(value, key, iv)  // iv: string (16 bytes)
Convert.decryptAesCbc(value, key, iv)
```

### Encryption Example

```javascript
// Encrypt query parameter
function encryptParam(text, key) {
    const data = Convert.encodeUtf8(text)
    const encrypted = Convert.encryptAesEcb(data, key)
    return Convert.encodeBase64(encrypted)
}

// Decrypt response
function decryptResponse(base64Text, key) {
    const encrypted = Convert.decodeBase64(base64Text)
    const decrypted = Convert.decryptAesEcb(encrypted, key)
    return Convert.decodeUtf8(decrypted)
}
```

## HTML Parsing API

### Basic Usage

```javascript
const doc = new HtmlDocument(htmlString)

// Query single element
const element = doc.querySelector(".class-name")

// Query all matching elements
const elements = doc.querySelectorAll(".item")
```

### Element Properties

```javascript
element.tagName        // Tag name (uppercase): "DIV", "A", "IMG"
element.text           // Text content (decoded)
element.innerHTML      // Inner HTML content
element.attributes     // Object of attributes: {class: "item", id: "main"}
element.getAttribute(name)  // Get specific attribute value
```

### Common Parsing Patterns

```javascript
// Extract links and titles
const items = []
const elements = doc.querySelectorAll('.comic-item')

for (const el of elements) {
    const linkEl = el.querySelector('a.title')
    const imgEl = el.querySelector('img')

    items.push({
        title: linkEl?.text?.trim(),
        url: linkEl?.getAttribute('href'),
        cover: imgEl?.getAttribute('src')
    })
}

// Handle relative URLs
function absoluteUrl(url, base) {
    if (url.startsWith('http')) return url
    if (url.startsWith('//')) return 'https:' + url
    if (url.startsWith('/')) return base.replace(/\/+$/, '') + url
    return base + url
}

// Extract data from table/list
const rows = doc.querySelectorAll('table tr')
const data = {}
for (const row of rows) {
    const cells = row.querySelectorAll('td')
    if (cells.length >= 2) {
        const key = cells[0].text.trim()
        const value = cells[1].text.trim()
        data[key] = value
    }
}
```

## UI API

### Messages

```javascript
UI.showMessage("Operation successful")  // Simple toast
```

### Dialogs

```javascript
// Alert dialog
UI.showDialog("Title", "Content message", [
    {
        text: "OK",
        callback: () => console.log("Confirmed")
    }
])

// Confirm dialog
UI.showDialog("Confirm", "Are you sure?", [
    { text: "Cancel", callback: () => {} },
    { text: "Confirm", callback: () => doSomething() }
])
```

### Loading

```javascript
UI.showLoading("Loading data...")
// ... async operation
UI.hideLoading()
```

### Input Dialog

```javascript
// Text input
const result = await UI.showInputDialog("Enter username", (value) => {
    if (value.length < 3) return "Username must be at least 3 characters"
    return null  // Validation passed
})

if (result !== null) {
    console.log("User entered:", result)
}
```

### Select Dialog

```javascript
const options = ["Action", "Comedy", "Drama", "Romance"]
const selectedIndex = await UI.showSelectDialog("Select genre", options, 0)

if (selectedIndex !== null) {
    console.log("Selected:", options[selectedIndex])
}
```

## App Info API

```javascript
APP.version      // App version: "1.0.5"
APP.locale       // User locale: "zh_CN", "en", "ja"
APP.platform     // Platform: "android", "ios", "windows", "macos", "linux"
```

## Date Utility

```javascript
// Format timestamp to string
__date(timestamp, format)

// Format placeholders:
// "y" or "Y" - Year (4 digits): 2024
// "M" - Month (01-12): 01
// "d" or "D" - Day (01-31): 15
// "h" or "H" - Hour (00-23): 14
// "m" - Minute (00-59): 30
// "s" or "S" - Second (00-59): 45

// Examples:
__date(1704067200000, "y-M-d")           // "2024-01-01"
__date(Date.now(), "y/M/d h:m:s")        // "2024/01/15 08:30:25"
__date(timestamp, "y年M月d日")          // "2024年01月15日"
```

## Advanced Patterns

### Pagination Helper

```javascript
class PaginationHelper {
    constructor(baseUrl, pageSize = 20) {
        this.baseUrl = baseUrl
        this.pageSize = pageSize
    }

    buildUrl(endpoint, page, params = {}) {
        const query = new URLSearchParams({
            ...params,
            page: page,
            limit: this.pageSize
        })
        return `${this.baseUrl}${endpoint}?${query.toString()}`
    }

    parseResponse(json, listKey = 'data') {
        const list = json[listKey] || []
        const total = json.total || list.length
        return {
            comics: list.map(item => this.transform(item)),
            maxPage: Math.ceil(total / this.pageSize)
        }
    }

    transform(item) {
        return new Comic({
            id: item.id,
            title: item.title,
            cover: item.cover
        })
    }
}

// Usage
const api = new PaginationHelper("https://api.example.com", 20)

async getPopular(page) {
    const url = api.buildUrl("/popular", page)
    const res = await Network.get(url)
    const json = JSON.parse(res.body)
    return api.parseResponse(json)
}
```

### Image URL Resolution

```javascript
class ImageResolver {
    constructor(baseUrl) {
        this.baseUrl = baseUrl
    }

    resolve(url) {
        if (!url) return ''
        if (url.startsWith('http')) return url
        if (url.startsWith('//')) return 'https:' + url
        if (url.startsWith('/')) return this.baseUrl + url
        return this.baseUrl + '/' + url
    }

    resolveSet(urls) {
        return urls.map(url => this.resolve(url))
    }
}

// Usage
const imgResolver = new ImageResolver("https://example.com")

const cover = imgResolver.resolve("/images/cover.jpg")
// "https://example.com/images/cover.jpg"
```

### Retry with Backoff

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const res = await Network.get(url, options.headers)

            if (res.statusCode >= 200 && res.statusCode < 300) {
                return res
            }

            if (res.statusCode >= 400 && res.statusCode < 500) {
                throw new Error(`Client error ${res.statusCode}: ${res.body}`)
            }

            // Server error, retry
            throw new Error(`Server error ${res.statusCode}`)

        } catch (e) {
            if (i === maxRetries - 1) throw e

            // Exponential backoff: 1s, 2s, 4s
            const delay = Math.pow(2, i) * 1000
            await new Promise(resolve => setTimeout(resolve, delay))
        }
    }
}

// Usage
async loadInfo(id) {
    const res = await fetchWithRetry(
        `https://api.example.com/comic/${id}`,
        {headers: {"Accept": "application/json"}},
        3
    )
    return JSON.parse(res.body)
}
```

### HTML Table Parser

```javascript
class TableParser {
    constructor(html) {
        this.doc = new HtmlDocument(html)
    }

    parse(tableSelector, mappings) {
        const table = this.doc.querySelector(tableSelector)
        if (!table) return []

        const rows = table.querySelectorAll('tr')
        const results = []

        for (const row of rows) {
            const cells = row.querySelectorAll('td, th')
            if (cells.length === 0) continue

            const item = {}
            for (const [key, index] of Object.entries(mappings)) {
                if (cells[index]) {
                    item[key] = cells[index].text.trim()
                }
            }
            results.push(item)
        }

        return results
    }

    parseKeyValue(tableSelector) {
        const table = this.doc.querySelector(tableSelector)
        if (!table) return {}

        const rows = table.querySelectorAll('tr')
        const result = {}

        for (const row of rows) {
            const cells = row.querySelectorAll('td, th')
            if (cells.length >= 2) {
                const key = cells[0].text.trim().replace(/:$/, '')
                const value = cells[1].text.trim()
                result[key] = value
            }
        }

        return result
    }
}

// Usage Examples

// Parse table with specific column mappings
const parser = new TableParser(htmlString)
const chapters = parser.parse('.chapter-table', {
    title: 0,    // Column 0 = title
    date: 1,     // Column 1 = date
    pages: 2     // Column 2 = page count
})

// Parse key-value table (like info tables)
const info = parser.parseKeyValue('.info-table')
// Returns: { "Author": "Name", "Status": "Ongoing", ... }
```

### URL Pattern Matcher

```javascript
class UrlPattern {
    constructor(pattern) {
        this.pattern = pattern
        this.regex = this.compile(pattern)
    }

    compile(pattern) {
        // Convert pattern to regex
        // :param matches any char except /
        // *param matches any chars including /
        const escaped = pattern
            .replace(/[.+^${}()|[\]\\]/g, '\\$&')
            .replace(/:([a-zA-Z_]+)/g, '([^/]+)')
            .replace(/\*([a-zA-Z_]+)/g, '(.+)')

        return new RegExp(`^${escaped}$`)
    }

    match(url) {
        const match = url.match(this.regex)
        if (!match) return null

        // Extract named parameters
        const params = {}
        const paramNames = []

        let matchIndex = 1
        const paramPattern = /:([a-zA-Z_]+)|\*([a-zA-Z_]+)/g
        let m

        while ((m = paramPattern.exec(this.pattern)) !== null) {
            paramNames.push(m[1] || m[2])
        }

        paramNames.forEach((name, i) => {
            params[name] = match[i + 1]
        })

        return params
    }
}

// Usage
const pattern = new UrlPattern("/comic/:id/chapter/:chapterId")
const params = pattern.match("/comic/12345/chapter/678")
// Returns: { id: "12345", chapterId: "678" }

// In source for URL parsing
extractIdsFromUrl(url) {
    // Handle different URL patterns
    const patterns = [
        new UrlPattern("/gallery/:id"),
        new UrlPattern("/manga/:id"),
        new UrlPattern("/comic/:id/page/:page")
    ]

    for (const pattern of patterns) {
        const params = pattern.match(url)
        if (params) return params
    }

    return null
}
```

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `ComicSource` | Base class for all sources |
| `Comic` | List item data model |
| `ComicDetails` | Detail view data model |
| `Comment` | Comment data model |
| `HtmlDocument` | HTML parser |
| `FormData` | Multipart form builder |
| `Url` | URL parser |

### Global APIs

| API | Description |
|-----|-------------|
| `Network.*` | HTTP requests (get, post, put, patch, delete) |
| `Convert.*` | Encoding & crypto (utf8, base64, hash, aes) |
| `UI.*` | User interface (message, dialog, loading, input) |
| `APP.version` | App version string |
| `APP.locale` | User locale (e.g., "zh_CN", "en") |
| `APP.platform` | Platform (android, ios, windows, macos, linux) |
| `__date()` | Format timestamp to string |

## Debugging & Testing

### Debug Print

```javascript
// Simple log (shown in console if available)
console.log("Debug:", variable)

// Show in UI
UI.showMessage(`Loaded ${count} items`)
```

### Network Debugging

```javascript
async getPopular(page) {
    const url = `https://api.example.com/popular?page=${page}`

    try {
        const res = await Network.get(url)

        // Debug: log response
        console.log("Status:", res.statusCode)
        console.log("Headers:", JSON.stringify(res.headers))
        console.log("Body preview:", res.body.substring(0, 500))

        if (res.statusCode !== 200) {
            throw new Error(`HTTP ${res.statusCode}`)
        }

        const json = JSON.parse(res.body)
        return this.parseComics(json.data)

    } catch (e) {
        console.error("Request failed:", e.message)
        UI.showMessage(`Error: ${e.message}`)
        throw e
    }
}
```

### Test Individual Methods

```javascript
// Add temporary test method to source
async testSearch() {
    try {
        const results = await this.search("test", 1, {})
        console.log("Search results:", JSON.stringify(results, null, 2))
        UI.showMessage(`Found ${results.length} results`)
    } catch (e) {
        console.error("Test failed:", e)
        UI.showMessage(`Test failed: ${e.message}`)
    }
}
```

## Common Issues & Solutions

### CORS / Request Blocked

```javascript
// Solution: Use proper headers and referer
const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Referer": "https://source-website.com/"
}

await Network.get(url, headers)
```

### JSON Parse Error

```javascript
// Solution: Handle non-JSON responses
async getPopular(page) {
    const res = await Network.get(url)

    let data
    try {
        data = JSON.parse(res.body)
    } catch (e) {
        // Try to extract JSON from HTML
        const match = res.body.match(/window\.__DATA__\s*=\s*({.+?});/)
        if (match) {
            data = JSON.parse(match[1])
        } else {
            throw new Error("Failed to parse response")
        }
    }

    return this.parseComics(data)
}
```

### Image Load Failure

```javascript
// Solution: Configure image loading
onImageLoad(config) {
    // Add required headers
    config.headers = config.headers || {}
    config.headers["Referer"] = "https://source-website.com/"
    config.headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"

    // Handle image processing
    config.onResponse = function(response) {
        // Process image data if needed
        return response
    }

    // Handle load failure
    config.onLoadFailed = function() {
        // Try alternative URL or show placeholder
        console.log("Image load failed:", config.url)
    }
}
```

### Rate Limiting

```javascript
// Solution: Add delays between requests
class RateLimiter {
    constructor(delayMs = 1000) {
        this.delayMs = delayMs
        this.lastRequest = 0
    }

    async wait() {
        const now = Date.now()
        const elapsed = now - this.lastRequest

        if (elapsed < this.delayMs) {
            await new Promise(resolve =>
                setTimeout(resolve, this.delayMs - elapsed)
            )
        }

        this.lastRequest = Date.now()
    }
}

// Usage in source
const rateLimiter = new RateLimiter(500)  // 500ms delay

async getPopular(page) {
    await rateLimiter.wait()
    const res = await Network.get(url)
    // ...
}
```

### Dynamic Content Loading

```javascript
// Solution: Handle AJAX-loaded content
async loadDynamicContent(url) {
    // First request to get page structure
    const res = await Network.get(url)
    const doc = new HtmlDocument(res.body)

    // Check if content is loaded via API
    const dataAttr = doc.querySelector('[data-api-endpoint]')
    if (dataAttr) {
        const apiUrl = dataAttr.getAttribute('data-api-endpoint')
        const apiRes = await Network.get(apiUrl)
        return JSON.parse(apiRes.body)
    }

    // Check if content is in script tag
    const script = doc.querySelector('script[data-comics]')
    if (script) {
        const jsonData = script.getAttribute('data-comics')
        return JSON.parse(jsonData)
    }

    // Content is in HTML, parse directly
    return this.parseFromHtml(doc)
}
```

## Source File Structure

```
my_source.js
├── Class Declaration (extends ComicSource)
├── Properties (name, key, version, etc.)
├── Helper Methods (optional)
│   ├── URL builders
│   ├── Response parsers
│   └── Data transformers
├── Core API Methods (required)
│   ├── getPopular(page)
│   ├── getLatest(page)
│   ├── search(keyword, page, options)
│   ├── loadInfo(id)
│   └── loadEp(comicId, chapterId)
└── Optional Methods
    ├── explore(page, selectedOptions)
    ├── login(username, password)
    ├── checkLogin()
    ├── getFavorites(page)
    ├── addFavorite(comicId)
    ├── removeFavorite(comicId)
    ├── getComments(comicId, page, replyTo)
    ├── sendComment(comicId, content, replyTo)
    ├── onImageLoad(config)
    └── onThumbnailLoad(config)
```

## Testing Checklist

Before releasing a source, verify:

- [ ] `getPopular(1)` returns valid comics with id, title, cover
- [ ] `getLatest(1)` returns valid data
- [ ] `search("test", 1, {})` returns relevant results
- [ ] `loadInfo(id)` returns valid ComicDetails with chapters
- [ ] `loadEp(comicId, chapterId)` returns image URLs
- [ ] Image URLs are absolute and load correctly
- [ ] Pagination works (page 1, 2, 3 return different results)
- [ ] Error handling works (network error, invalid response)
- [ ] Optional: search with filters/options works
- [ ] Optional: login/logout works if source requires auth
- [ ] Optional: favorites sync works if implemented

## Resources

- Reference implementations in same directory
- Test with `venera-configs/` sources as examples
- Official template: `venera-configs/_template_.js`
