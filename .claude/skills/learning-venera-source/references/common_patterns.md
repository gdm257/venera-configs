# Common Patterns for Venera Sources

Common patterns and solutions for typical source development scenarios.

## HTML Parsing Patterns

### Basic Item Extraction

```javascript
// Pattern: Extract items from list
extractItems(html, selector) {
    const doc = new HtmlDocument(html)
    const elements = doc.querySelectorAll(selector)
    const items = []

    for (const el of elements) {
        items.push({
            title: el.querySelector('.title')?.text?.trim(),
            link: el.querySelector('a')?.getAttribute('href'),
            image: el.querySelector('img')?.getAttribute('src')
        })
    }

    return items
}
```

### Table Data Extraction

```javascript
// Pattern: Extract data from table rows
extractTableData(html, tableSelector) {
    const doc = new HtmlDocument(html)
    const table = doc.querySelector(tableSelector)
    const rows = table?.querySelectorAll('tr') || []
    const data = []

    for (const row of rows) {
        const cells = row.querySelectorAll('td, th')
        if (cells.length === 0) continue

        data.push(cells.map(c => c.text.trim()))
    }

    return data
}

// Pattern: Extract key-value pairs from table
extractKeyValueTable(html, tableSelector) {
    const data = this.extractTableData(html, tableSelector)
    const result = {}

    for (const row of data) {
        if (row.length >= 2) {
            const key = row[0].replace(/:$/, '').trim()
            const value = row[1].trim()
            result[key] = value
        }
    }

    return result
}
```

### Navigation Pagination

```javascript
// Pattern: Find next/prev page URLs
findPagination(html) {
    const doc = new HtmlDocument(html)

    // Find next page
    const nextLink = doc.querySelector('a.next, a[rel="next"]')
    const nextUrl = nextLink?.getAttribute('href')

    // Find previous page
    const prevLink = doc.querySelector('a.prev, a[rel="prev"]')
    const prevUrl = prevLink?.getAttribute('href')

    // Find total pages
    const pageInfo = doc.querySelector('.page-info, .pagination-info')
    const totalMatch = pageInfo?.text?.match(/(\d+)\s*pages?/i)
    const totalPages = totalMatch ? parseInt(totalMatch[1]) : null

    return {
        next: nextUrl,
        previous: prevUrl,
        totalPages: totalPages
    }
}
```

## API Request Patterns

### REST API Standard

```javascript
// Pattern: Standard REST API client
class ApiClient {
    constructor(baseUrl, apiKey = null) {
        this.baseUrl = baseUrl.replace(/\/$/, '')
        this.apiKey = apiKey
    }

    async request(method, endpoint, params = {}, body = null) {
        const url = new Url(`${this.baseUrl}${endpoint}`)

        // Add query params
        for (const [key, value] of Object.entries(params)) {
            url.query[key] = value
        }

        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }

        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`
        }

        const data = body ? JSON.stringify(body) : null
        const res = await Network.sendRequest(method, url.toString(), headers, data)

        if (res.statusCode >= 400) {
            throw new Error(`API Error ${res.statusCode}: ${res.body}`)
        }

        return JSON.parse(res.body)
    }

    async get(endpoint, params = {}) {
        return this.request('GET', endpoint, params)
    }

    async post(endpoint, body, params = {}) {
        return this.request('POST', endpoint, params, body)
    }
}

// Usage in source
class MySource extends ComicSource {
    api = null

    async init() {
        this.api = new ApiClient('https://api.example.com')
    }

    async getPopular(page) {
        const data = await this.api.get('/manga/popular', {page})
        return data.results.map(item => new Comic({
            id: item.id,
            title: item.title,
            cover: item.cover_url
        }))
    }
}
```

### GraphQL API

```javascript
// Pattern: GraphQL client
class GraphQLClient {
    constructor(endpoint) {
        this.endpoint = endpoint
    }

    async query(query, variables = {}) {
        const res = await Network.post(
            this.endpoint,
            {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            JSON.stringify({query, variables})
        )

        if (res.statusCode !== 200) {
            throw new Error(`GraphQL Error: ${res.body}`)
        }

        const data = JSON.parse(res.body)

        if (data.errors) {
            throw new Error(data.errors.map(e => e.message).join(', '))
        }

        return data.data
    }
}

// Usage
const graphql = new GraphQLClient('https://api.example.com/graphql')

async getPopular(page) {
    const query = `
        query GetPopularManga($page: Int!) {
            popular(page: $page) {
                id
                title
                cover
            }
        }
    `

    const data = await graphql.query(query, {page})

    return data.popular.map(m => new Comic({
        id: m.id,
        title: m.title,
        cover: m.cover
    }))
}
```

### Form-Based APIs

```javascript
// Pattern: Handling form-based data submission
async submitForm(formData, actionUrl) {
    const form = new FormData()

    for (const [key, value] of Object.entries(formData)) {
        form.append(key, value)
    }

    const res = await Network.post(
        actionUrl,
        {
            'Referer': actionUrl,
            'User-Agent': 'Mozilla/5.0...'
        },
        form
    )

    return res
}

// Pattern: Handling CSRF tokens
async postWithCSRF(url, data) {
    // First get the page to extract CSRF token
    const pageRes = await Network.get(url)
    const doc = new HtmlDocument(pageRes.body)

    const csrfToken = doc.querySelector('input[name="csrf_token"]')?.getAttribute('value')

    // Now post with the token
    const form = new FormData()
    form.append('csrf_token', csrfToken)

    for (const [key, value] of Object.entries(data)) {
        form.append(key, value)
    }

    return await Network.post(url, {}, form)
}
```

## Authentication Patterns

### Session-Based Auth

```javascript
class MySource extends ComicSource {
    sessionCookie = null

    async login(username, password) {
        const form = new FormData()
        form.append('username', username)
        form.append('password', password)

        const res = await Network.post(
            'https://example.com/login',
            {},
            form
        )

        if (res.statusCode === 200) {
            // Extract session cookie from response headers
            const cookies = res.headers['set-cookie']
            if (cookies) {
                this.sessionCookie = cookies.split(';')[0]
                return {success: true}
            }
        }

        return {success: false, message: "Login failed"}
    }

    getAuthHeaders() {
        return this.sessionCookie
            ? {'Cookie': this.sessionCookie}
            : {}
    }

    async getPopular(page) {
        const res = await Network.get(
            `https://example.com/popular?page=${page}`,
            this.getAuthHeaders()
        )
        // ... parse response
    }
}
```

### Token-Based Auth

```javascript
class MySource extends ComicSource {
    accessToken = null
    refreshToken = null
    tokenExpiry = null

    async login(username, password) {
        const res = await Network.post(
            'https://api.example.com/auth/login',
            {'Content-Type': 'application/json'},
            JSON.stringify({username, password})
        )

        const data = JSON.parse(res.body)

        if (data.access_token) {
            this.accessToken = data.access_token
            this.refreshToken = data.refresh_token
            this.tokenExpiry = Date.now() + (data.expires_in * 1000)
            return {success: true}
        }

        return {success: false, message: data.message || "Login failed"}
    }

    async refreshAccessToken() {
        if (!this.refreshToken) return false

        const res = await Network.post(
            'https://api.example.com/auth/refresh',
            {'Content-Type': 'application/json'},
            JSON.stringify({refresh_token: this.refreshToken})
        )

        const data = JSON.parse(res.body)

        if (data.access_token) {
            this.accessToken = data.access_token
            this.tokenExpiry = Date.now() + (data.expires_in * 1000)
            return true
        }

        return false
    }

    async getAuthHeaders() {
        // Check if token needs refresh
        if (this.tokenExpiry && Date.now() > this.tokenExpiry - 60000) {
            await this.refreshAccessToken()
        }

        return this.accessToken
            ? {'Authorization': `Bearer ${this.accessToken}`}
            : {}
    }

    async getPopular(page) {
        const res = await Network.get(
            `https://api.example.com/manga/popular?page=${page}`,
            await this.getAuthHeaders()
        )
        // ... parse
    }
}
```

### API Key Auth

```javascript
class MySource extends ComicSource {
    apiKey = null

    async init() {
        // API key could be hardcoded for public sources
        this.apiKey = "your-api-key-here"

        // Or loaded from configuration
        // this.apiKey = await this.loadConfig('api_key')
    }

    getAuthHeaders() {
        return this.apiKey
            ? {'X-API-Key': this.apiKey}
            : {}
    }

    // Or include in query params
    buildUrl(endpoint, params = {}) {
        if (this.apiKey) {
            params.api_key = this.apiKey
        }
        const query = new URLSearchParams(params)
        return `https://api.example.com${endpoint}?${query.toString()}`
    }
}
```

## Error Handling Patterns

### Retry with Exponential Backoff

```javascript
async function withRetry(fn, maxRetries = 3, baseDelay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn()
        } catch (e) {
            if (i === maxRetries - 1) throw e

            // Don't retry client errors (4xx) except 429 (rate limit)
            if (e.statusCode >= 400 && e.statusCode < 500 && e.statusCode !== 429) {
                throw e
            }

            const delay = baseDelay * Math.pow(2, i)
            await new Promise(r => setTimeout(r, delay))
        }
    }
}

// Usage
async getPopular(page) {
    return withRetry(async () => {
        const res = await Network.get(url)
        if (res.statusCode !== 200) {
            throw new Error(`HTTP ${res.statusCode}`)
        }
        return this.parseResponse(res.body)
    })
}
```

### Circuit Breaker

```javascript
class CircuitBreaker {
    constructor(threshold = 5, timeout = 60000) {
        this.failureCount = 0
        this.threshold = threshold
        this.timeout = timeout
        this.state = 'CLOSED' // CLOSED, OPEN, HALF_OPEN
        this.nextAttempt = Date.now()
    }

    async execute(fn) {
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
                throw new Error('Circuit breaker is open')
            }
            this.state = 'HALF_OPEN'
        }

        try {
            const result = await fn()
            this.onSuccess()
            return result
        } catch (e) {
            this.onFailure()
            throw e
        }
    }

    onSuccess() {
        this.failureCount = 0
        this.state = 'CLOSED'
    }

    onFailure() {
        this.failureCount++

        if (this.failureCount >= this.threshold) {
            this.state = 'OPEN'
            this.nextAttempt = Date.now() + this.timeout
        }
    }
}

// Usage
const breaker = new CircuitBreaker(5, 60000)

async getPopular(page) {
    return breaker.execute(async () => {
        const res = await Network.get(url)
        return this.parseResponse(res.body)
    })
}
```

### Fallback Strategies

```javascript
class FallbackStrategy {
    constructor(primary, fallback) {
        this.primary = primary
        this.fallback = fallback
    }

    async execute() {
        try {
            return await this.primary()
        } catch (e) {
            console.warn('Primary failed, using fallback:', e.message)
            return await this.fallback()
        }
    }
}

// Usage: Try API first, then fallback to scraping
async getPopular(page) {
    const apiStrategy = async () => {
        const res = await Network.get(`https://api.example.com/popular?page=${page}`)
        return this.parseApiResponse(res.body)
    }

    const scrapeStrategy = async () => {
        const res = await Network.get(`https://example.com/popular?page=${page}`)
        return this.parseHtmlResponse(res.body)
    }

    const strategy = new FallbackStrategy(apiStrategy, scrapeStrategy)
    return strategy.execute()
}
```

## Response Parsing Patterns

### JSON API Response

```javascript
// Standard REST API response
parseApiResponse(body) {
    const json = JSON.parse(body)

    // Handle different response structures
    const data = json.data || json.results || json.items || json

    return data.map(item => new Comic({
        id: item.id || item.manga_id,
        title: item.title || item.name,
        cover: item.cover || item.cover_url || item.thumbnail,
        subtitle: item.author || item.artist || item.subtitle,
        tags: item.genres || item.tags || item.categories
    }))
}
```

### HTML Scraping Response

```javascript
// HTML list scraping
parseHtmlList(html) {
    const doc = new HtmlDocument(html)
    const items = doc.querySelectorAll('.manga-item, .comic-item, .item')

    return items.map(el => {
        // Try multiple selectors for robustness
        const link = el.querySelector('a.title, a.manga-title, h2 a, h3 a')
        const img = el.querySelector('img.cover, img.thumbnail, img')
        const author = el.querySelector('.author, .artist, [data-field="author"]')

        return new Comic({
            id: this.extractId(link?.getAttribute('href')),
            title: link?.text?.trim() || img?.getAttribute('alt'),
            cover: img?.getAttribute('src') || img?.getAttribute('data-src'),
            subtitle: author?.text?.trim()
        })
    }).filter(c => c.id && c.title)  // Filter out invalid items
}

// Extract ID from URL
extractId(url) {
    if (!url) return null

    // Try different patterns
    const patterns = [
        /\/manga\/(\d+)/,
        /\/comic\/(\w+)/,
        /[?&]id=(\d+)/,
        /\/(\d+)\.html$/
    ]

    for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match) return match[1]
    }

    // Fallback: use last path segment
    const segments = url.split('/').filter(s => s)
    return segments[segments.length - 1]?.replace(/\.html?$/, '')
}
```

### Mixed API + HTML

```javascript
// Some sites use API for list but HTML for details
async loadInfo(id) {
    // Try API first
    try {
        const res = await Network.get(
            `https://api.example.com/manga/${id}`,
            {'Accept': 'application/json'}
        )

        if (res.statusCode === 200) {
            const data = JSON.parse(res.body)
            return this.parseApiDetails(data)
        }
    } catch (e) {
        console.log('API failed, falling back to HTML')
    }

    // Fallback to HTML scraping
    const res = await Network.get(`https://example.com/manga/${id}`)
    return this.parseHtmlDetails(res.body)
}
```

## Caching Patterns

### In-Memory Cache

```javascript
class SimpleCache {
    constructor(ttl = 5 * 60 * 1000) {  // 5 minutes default
        this.cache = new Map()
        this.ttl = ttl
    }

    get(key) {
        const item = this.cache.get(key)
        if (!item) return null

        if (Date.now() > item.expiry) {
            this.cache.delete(key)
            return null
        }

        return item.value
    }

    set(key, value, customTtl = null) {
        this.cache.set(key, {
            value,
            expiry: Date.now() + (customTtl || this.ttl)
        })
    }

    clear() {
        this.cache.clear()
    }
}

// Usage in source
class MySource extends ComicSource {
    cache = new SimpleCache(10 * 60 * 1000)  // 10 min cache

    async loadInfo(id) {
        // Check cache first
        const cached = this.cache.get(`info_${id}`)
        if (cached) return cached

        // Fetch fresh data
        const res = await Network.get(`https://api.example.com/manga/${id}`)
        const details = this.parseDetails(JSON.parse(res.body))

        // Cache result
        this.cache.set(`info_${id}`, details)

        return details
    }
}
```

## Rate Limiting

### Request Throttler

```javascript
class Throttler {
    constructor(requestsPerSecond = 2) {
        this.minInterval = 1000 / requestsPerSecond
        this.lastRequest = 0
    }

    async throttle() {
        const now = Date.now()
        const elapsed = now - this.lastRequest

        if (elapsed < this.minInterval) {
            await new Promise(r =>
                setTimeout(r, this.minInterval - elapsed)
            )
        }

        this.lastRequest = Date.now()
    }
}

// Usage
const throttler = new Throttler(1)  // 1 request per second

async getPopular(page) {
    await throttler.throttle()
    const res = await Network.get(url)
    // ...
}
```

## Data Transformation

### Text Cleaning

```javascript
class TextCleaner {
    static clean(text) {
        if (!text) return ''

        return text
            .replace(/\s+/g, ' ')           // Collapse whitespace
            .replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '')  // Trim
            .replace(/\n{3,}/g, '\n\n')       // Collapse newlines
    }

    static extractInt(text) {
        const match = String(text).match(/(\d+)/)
        return match ? parseInt(match[1]) : 0
    }

    static extractFloat(text) {
        const match = String(text).match(/([\d.]+)/)
        return match ? parseFloat(match[1]) : 0
    }
}

// Usage
const title = TextCleaner.clean(el.querySelector('.title')?.text)
const views = TextCleaner.extractInt(el.querySelector('.views')?.text)
```
