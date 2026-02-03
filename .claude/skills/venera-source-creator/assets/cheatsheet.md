# Venera Source Cheatsheet

Quick reference for Venera source development.

## Core Properties (Required)

```javascript
class MySource extends ComicSource {
    name = 'Source Name';           // Display name
    key = 'source_key';            // Unique identifier (camelCase)
    version = '1.0.0';             // Source version
    minAppVersion = '1.0.0';       // Minimum Venera version
    url = 'https://example.com';   // Base URL
}
```

## Method Signatures

### Core Methods
```javascript
// Explore/Browse
async explore(page = 1) → Comic[]

// Category browsing  
async category(categoryId, page = 1) → Comic[]

// Search
async search(keyword, page = 1) → Comic[]

// Comic details
async comic.loadInfo(comicId) → ComicDetails

// Episode loading
async comic.loadEp(episodeId) → Episode
```

### Optional Methods
```javascript
// User account
account = {
    async login(credentials) → { success, user },
    async logout() → { success },
    async checkLogin() → { loggedIn, user }
}

// Favorites
favorites = {
    async list(page = 1) → Comic[],
    async add(comicId) → { success },
    async remove(comicId) → { success }
}

// Comments
async comic.loadComments(comicId, page = 1) → Comment[]
async comment.loadReply(commentId, page = 1) → Comment[]

// Configuration
optionList() → Option[]
optionLoader() → Object

// Image loading
onImageLoad(config) → config
onThumbnailLoad(config) → config
```

## Data Models

### Comic
```javascript
new Comic({
    id: string,           // Required
    title: string,        // Required
    cover: string,        // Required  
    tags: string[],       // Required
    description: string,  // Required
    author: string,       // Optional
    status: string,       // Optional: 'ongoing', 'completed', 'hiatus', 'cancelled'
    updateTime: number    // Optional: timestamp (ms)
})
```

### ComicDetails
```javascript
new ComicDetails({
    // All Comic properties +
    episodes: Episode[],   // Required
    related: Comic[],      // Optional
    comments: Comment[]    // Optional
})
```

### Episode
```javascript
new Episode({
    id: string,           // Required
    title: string,        // Required
    order: number,        // Required
    uploadTime: number,   // Required
    pages: Page[]         // Required
})
```

### Page
```javascript
new Page({
    id: string,           // Required
    url: string,          // Required
    order: number         // Required
})
```

### Comment
```javascript
new Comment({
    id: string,           // Required
    userId: string,       // Required
    username: string,     // Required
    avatar: string,       // Required
    content: string,      // Required
    time: number,         // Required
    likes: number         // Required
})
```

## Network API

### Basic Usage
```javascript
// GET request
const response = await Network.get(url, {
    params: { page: 1, limit: 20 },
    headers: { 'User-Agent': 'Venera/1.0' }
});

// POST request  
await Network.post(url, data, options);

// DELETE request
await Network.delete(url, options);
```

### Response Structure
```javascript
{
    ok: boolean,      // HTTP status 2xx
    status: number,   // HTTP status code
    data: any,        // Parsed response body
    headers: object,  // Response headers
    config: object    // Request configuration
}
```

### Error Handling
```javascript
try {
    const response = await Network.get(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.data;
} catch (error) {
    throw new Error(`Request failed: ${error.message}`);
}
```

## Helper Functions

### Parse Comic
```javascript
function parseComic(raw) {
    return new Comic({
        id: String(raw.id),
        title: raw.title,
        cover: raw.cover_url,
        tags: raw.tags || [],
        description: raw.description || '',
        author: raw.author || '',
        status: mapStatus(raw.status),
        updateTime: new Date(raw.updated_at).getTime()
    });
}
```

### Parse Episode
```javascript
function parseEpisode(raw) {
    return new Episode({
        id: String(raw.id),
        title: raw.title || `Chapter ${raw.chapter_number}`,
        order: raw.chapter_number || raw.order,
        uploadTime: new Date(raw.uploaded_at).getTime(),
        pages: raw.pages.map((url, i) => new Page({
            id: `${raw.id}-${i + 1}`,
            url: url,
            order: i + 1
        }))
    });
}
```

### Status Mapping
```javascript
function mapStatus(rawStatus) {
    const map = {
        'ongoing': 'ongoing',
        'completed': 'completed',
        'hiatus': 'hiatus', 
        'cancelled': 'cancelled',
        'finished': 'completed',
        'publishing': 'ongoing'
    };
    return map[rawStatus?.toLowerCase()] || 'unknown';
}
```

## Configuration Options

### Option Types
```javascript
// Select option
{
    key: 'sort_by',
    title: 'Sort By',
    type: 'select',
    options: [
        { label: 'Popularity', value: 'popular' },
        { label: 'Latest', value: 'latest' }
    ],
    defaultValue: 'popular'
}

// Switch option  
{
    key: 'adult_content',
    title: 'Show Adult Content',
    type: 'switch',
    defaultValue: false
}

// Text option
{
    key: 'api_key',
    title: 'API Key',
    type: 'text',
    defaultValue: ''
}
```

### Using Options
```javascript
optionList() {
    return [/* option definitions */];
}

optionLoader() {
    return {
        sort_by: this.loadData('sort_by') || 'popular',
        adult_content: this.loadData('adult_content') || false
    };
}

async search(keyword, page = 1) {
    const options = this.optionLoader();
    const params = {
        q: keyword,
        page: page,
        sort: options.sort_by,
        adult: options.adult_content
    };
    // Use params in API call
}
```

## Best Practices

### Error Messages
- Use descriptive, user-friendly error messages
- Include HTTP status codes when available
- Don't expose internal API details to users

### Performance
- Implement pagination for lists
- Use `Promise.all()` for parallel requests
- Cache frequently accessed data when appropriate

### Compatibility
- Handle missing fields gracefully
- Convert IDs to strings
- Validate API responses before parsing

### Security
- Never hardcode API keys or secrets
- Use HTTPS for all requests
- Validate and sanitize user input

## Quick Start Commands

```bash
# Create new source (any directory)
python scripts/create_source.py --name "MyManga" --key "my_manga" --url "https://api.manga.com" --output ./sources/my_manga.js

# Validate source
python scripts/validate_source.py ./sources/my_manga.js

# Fix API endpoints  
python scripts/fix_api_endpoints.py --input ./sources/broken_source.js --output ./sources/fixed_source.js
```

## Troubleshooting

### Common Issues
- **Network errors**: Check CORS, add Referer header
- **Authentication failures**: Verify cookies/tokens, implement refresh logic  
- **Parsing errors**: Validate response structure, handle missing fields
- **Performance issues**: Implement pagination, add caching

### Debugging Tips
1. Test API endpoints directly (curl/Postman)
2. Check response structure matches expectations
3. Verify all required fields are present
4. Test error scenarios (network failures, invalid responses)