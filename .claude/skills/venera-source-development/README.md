# Learning Venera Source Skill

Complete self-contained guide for creating, fixing, and maintaining Venera comic sources.

## Files

| File | Description |
|------|-------------|
| `SKILL.md` | Main guide (500 lines) - Quick start, data models, API reference, common issues |
| `references/data_models.md` | Complete data models: Comic, ComicDetails, Comment, ImageLoadingConfig |
| `references/venera_api.md` | Full API reference: Network, Convert, HtmlDocument, UI, APP, etc. |
| `references/common_patterns.md` | Common patterns: HTML parsing, API clients, caching, auth, error handling |
| `assets/template.js` | Full source template with all methods documented |
| `scripts/source_validator.py` | Python validator for source files |

## Quick Start

1. Copy `assets/template.js` to your new source file
2. Modify the class name and properties
3. Implement the 5 required methods: `getPopular`, `getLatest`, `search`, `loadInfo`, `loadEp`
4. Validate with: `python scripts/source_validator.py your_source.js`

## Required Methods

```javascript
async getPopular(page)     // Returns Comic[]
async getLatest(page)      // Returns Comic[]
async search(keyword, page, options)  // Returns Comic[]
async loadInfo(id)         // Returns ComicDetails
async loadEp(comicId, chapterId)      // Returns string[] (image URLs)
```

## Data Models

```javascript
new Comic({
    id: "required",      // Unique identifier
    title: "required", // Display title
    cover: "",         // Cover image URL
    subtitle: "",      // Author/subtitle
    tags: [],          // Genre tags
    // ... more optional fields
})

new ComicDetails({
    title: "required",
    cover: "",
    description: "",
    tags: {},          // { "Category": [...], "Author": [...] }
    chapters: [],      // [{ title, id, time, page }]
    // ... more optional fields
})
```

## Common APIs

```javascript
// Network requests
await Network.get(url, headers)
await Network.post(url, headers, body)
await Network.fetchBytes(method, url, headers, data)

// Encoding/Crypto
Convert.encodeUtf8(str)
Convert.decodeUtf8(buffer)
Convert.encodeBase64(buffer)
Convert.md5(buffer)
Convert.encryptAesEcb(value, key)

// HTML Parsing
const doc = new HtmlDocument(htmlString)
doc.querySelector(selector)
doc.querySelectorAll(selector)

// UI
UI.showMessage(message)
UI.showDialog(title, content, actions)
UI.showInputDialog(title, validator)
UI.showSelectDialog(title, options, defaultIndex)

// App Info
APP.version
APP.locale
APP.platform
```

## Common Issues & Solutions

### CORS/Request Blocked
```javascript
const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    "Referer": "https://source-website.com/"
}
await Network.get(url, headers)
```

### Image Loading Fix
```javascript
onImageLoad(config) {
    config.headers = config.headers || {}
    config.headers["Referer"] = "https://source-website.com/"
}
```

### Rate Limiting
```javascript
// Add delay between requests
async throttle() {
    await new Promise(r => setTimeout(r, 1000))
}
```

## Testing Checklist

Before releasing:
- [ ] `getPopular(1)` returns valid comics
- [ ] `getLatest(1)` returns valid data
- [ ] `search("test", 1, {})` returns results
- [ ] `loadInfo(id)` returns valid ComicDetails
- [ ] `loadEp(comicId, chapterId)` returns image URLs
- [ ] Images load correctly
- [ ] Pagination works (different results per page)
- [ ] Error handling works

## More Resources

- `references/` - Detailed API and pattern documentation
- `assets/template.js` - Full working template
- `scripts/source_validator.py` - Source validation tool

---

**Goal**: Create, fix, and maintain Venera sources without reading the main codebase.
