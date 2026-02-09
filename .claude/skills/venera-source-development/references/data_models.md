# Venera Source Data Models Reference

Complete reference for all data models used in Venera comic sources.

## Comic (List Item)

Displayed in comic lists (search results, popular, latest, etc.).

```javascript
new Comic({
    // Required
    id: "string",           // Unique identifier (used in loadInfo)
    title: "string",        // Display title

    // Optional but recommended
    cover: "string",        // Cover image URL
    subtitle: "string",     // Author, artist, or subtitle line

    // Optional
    tags: ["string"],       // Tags/categories array
    description: "string",  // Brief description (may be truncated in list view)
    maxPage: 1,             // Total page count (if applicable)
    language: "string",     // Language code (e.g., "zh", "en", "ja")
    favoriteId: "string",   // ID for favorite/bookmark
    stars: 5                // Rating 1-5 (visual star rating)
})
```

### Example

```javascript
return [
    new Comic({
        id: "manga-12345",
        title: "One Piece",
        cover: "https://example.com/covers/12345.jpg",
        subtitle: "Eiichiro Oda",
        tags: ["Action", "Adventure", "Shounen"],
        language: "ja",
        stars: 5
    }),
    // ... more comics
]
```

## ComicDetails (Detail View)

Full comic information displayed in detail view.

```javascript
new ComicDetails({
    // === Basic Info ===
    title: "string",        // Required: Comic title
    subtitle: "string",     // Optional: Subtitle/alias
    cover: "string",        // Optional: Cover image URL
    description: "string",  // Optional: Full description

    // === Tags ===
    tags: {                 // Optional: Categorized tags
        "Genre": ["Action", "Drama"],
        "Author": ["Author Name"],
        "Artist": ["Artist Name"],
        "Status": ["Ongoing"],
        // ... any custom categories
    },

    // === Chapters ===
    chapters: [             // Optional: Chapter list
        {
            title: "Chapter 1: Title",  // Chapter title
            id: "chapter-1",            // Unique chapter ID
            time: "2024-01-15",         // Release/update time
            page: 24                    // Page count
        }
    ],

    // === Interaction ===
    isFavorite: false,      // Optional: Is in favorites
    subId: "string",        // Optional: Subscribe/follow ID

    // === Media ===
    thumbnails: ["string"], // Optional: Preview thumbnails
    recommend: [Comic],     // Optional: Recommended comics

    // === Community ===
    commentCount: 0,        // Optional: Total comments
    likesCount: 0,          // Optional: Like count
    isLiked: false,         // Optional: User liked
    comments: [Comment],    // Optional: Recent comments

    // === Metadata ===
    uploader: "string",     // Optional: Uploader name
    updateTime: "string",   // Optional: Last update
    uploadTime: "string",   // Optional: Upload time
    url: "string",          // Optional: Source URL
    stars: 5,               // Optional: Rating
    maxPage: 1              // Optional: Max page count
})
```

### Example

```javascript
async loadInfo(id) {
    const res = await Network.get(`https://api.example.com/manga/${id}`)
    const data = JSON.parse(res.body)

    return new ComicDetails({
        title: data.title,
        subtitle: data.alternative_titles?.join(", ") || "",
        cover: data.cover_url,
        description: data.synopsis,

        tags: {
            "Genre": data.genres || [],
            "Author": data.authors || [],
            "Status": [data.status]
        },

        chapters: data.chapters?.map(ch => ({
            title: `Chapter ${ch.number}${ch.title ? ": " + ch.title : ""}`,
            id: ch.id,
            time: ch.updated_at,
            page: ch.page_count
        })) || [],

        isFavorite: data.is_favorite,
        recommend: data.recommendations?.map(r => new Comic({
            id: r.id,
            title: r.title,
            cover: r.cover_url
        }))
    })
}
```

## Comment

Individual comment/review data.

```javascript
new Comment({
    userName: "string",     // Display name
    avatar: "string",       // Avatar image URL
    content: "string",      // Comment text
    time: "string",         // Timestamp
    replyCount: 0,          // Number of replies
    id: "string",           // Unique comment ID
    isLiked: false,         // Current user liked
    score: 5,               // Rating score (1-5)
    voteStatus: "string"    // "up", "down", or null
})
```

## ImageLoadingConfig

Image loading configuration (modified in `onImageLoad` and `onThumbnailLoad`).

```javascript
// Example onImageLoad implementation
onImageLoad(config) {
    // Request configuration
    config.headers = config.headers || {}
    config.headers["Referer"] = "https://example.com/"
    config.headers["User-Agent"] = "Mozilla/5.0..."

    // Request method and body (for POST requests)
    config.method = "POST"
    config.data = JSON.stringify({image_id: this.extractId(config.url)})

    // Response processing
    config.onResponse = function(response) {
        // Modify response before image processing
        if (response.headers["content-type"] === "application/json") {
            const json = JSON.parse(response.body)
            // Return modified response
            return {
                ...response,
                body: json.image_data  // Extract image data from JSON
            }
        }
        return response
    }

    // Image processing (for data URIs or modifications)
    config.modifyImage = function(imageData) {
        // imageData is Uint8Array
        // Return modified data or null for no change
        return imageData
    }

    // Load failure handling
    config.onLoadFailed = function() {
        // Try fallback URL
        config.url = config.url.replace("cdn1", "cdn2")
        return true  // Return true to retry with modified config
    }
}
```

### Config Properties

| Property | Type | Description |
|----------|------|-------------|
| `url` | string | Image URL (can be modified) |
| `method` | string | HTTP method (GET/POST) |
| `headers` | object | Request headers |
| `data` | string | Request body (for POST) |
| `onResponse` | function | Process response before image loading |
| `modifyImage` | function | Process loaded image data |
| `onLoadFailed` | function | Handle load failure |

## Return Types Summary

| Method | Return Type | Notes |
|--------|-------------|-------|
| `getPopular(page)` | `Comic[]` or `{comics: Comic[], maxPage?: number}` | Popular/home comics |
| `getLatest(page)` | `Comic[]` or `{comics: Comic[], maxPage?: number}` | Latest updates |
| `search(keyword, page, options)` | `Comic[]` or `{comics: Comic[], maxPage?: number}` | Search results |
| `loadInfo(id)` | `ComicDetails` | Full comic details |
| `loadEp(comicId, chapterId)` | `string[]` or `{images: string[], maxPage?: number}` | Chapter image URLs |
| `explore(page, selectedOptions)` | `Comic[]` | Explore page results |
| `getFavorites(page)` | `Comic[]` or `{comics: Comic[], maxPage?: number}` | User favorites |

## Error Handling Best Practices

```javascript
// Always wrap external requests
try {
    const res = await Network.get(url)

    if (res.statusCode >= 400) {
        throw new Error(`HTTP ${res.statusCode}: ${res.body.substring(0, 100)}`)
    }

    return this.parseResponse(res.body)

} catch (e) {
    // Log for debugging
    console.error(`${this.name} error:`, e.message)

    // Show user-friendly message
    UI.showMessage(`加载失败: ${e.message}`)

    // Re-throw for upstream handling
    throw e
}
```
