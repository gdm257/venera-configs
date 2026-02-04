---
name: Venera Source Creator
description: This skill should be used when creating, fixing, or updating Venera manga/comic reader source configurations. Provides comprehensive guidance for implementing ComicSource classes with proper API integration, data parsing, and configuration patterns for Venera's multi-source manga reader ecosystem.
---

# Venera Source Creator

Complete toolkit for creating and maintaining Venera manga/comic source configurations. This skill enables systematic development of ComicSource classes that integrate with Venera's unified API system.

## Core Concepts

### Venera Architecture
- **ComicSource Base Class**: All sources extend this class with optional method implementations
- **Network API**: Global `Network` object with `fetchBytes()` and `sendRequest()` methods
- **Utility APIs**: `Convert` for encoding/decoding, `HtmlDocument` for HTML parsing, `Image` for image manipulation
- **Data Models**: `Comic()`, `ComicDetails()`, `Comment()`, `ImageLoadingConfig()` constructor functions
- **App Info**: `APP` global object with version, locale, and platform info
- **Configuration Pattern**: Each source is a standalone `.js` file

### Required Properties
Every source must define these properties:
- `name`: Display name of the source
- `key`: Unique identifier (snake_case, matches filename)
- `version`: Source configuration version (semantic versioning)
- `minAppVersion`: Minimum Venera app version required (e.g., "1.4.0")
- `url`: Update URL where users can download the latest version

### Core API Methods (Recommended)
- `getPopular(page)`: Returns popular comics for homepage
- `getLatest(page)`: Returns recently updated comics  
- `search(keyword, page)`: Search comics by keyword
- `loadInfo(id)`: Load full comic details including chapters
- `loadEp(comicId, chapterId)`: Load chapter images

### Optional Features
- **User Features**: `login()`, `checkLogin()`, `getFavorites()` 
- **Image Configuration**: `onImageLoad(config)`, `onThumbnailLoad(config)`
- **Custom Headers**: Set `defaultHeaders` property for API requests

### Important Notes
- **Constructor Functions**: Use `Comic({...})`, `ComicDetails({...})` - these are functions, not classes
- **Chapter Structure**: `chapters` must be a Map where keys are volume names and values are Maps of chapterId->title
- **Tags Organization**: Tags should be organized in a Map by category (e.g., `{"Genres": ["Action"], "Status": ["Ongoing"]}`)
- **Network API**: Use `Network.sendRequest(method, url, headers, data, extra)` or `Network.fetchBytes(...)` for binary data

## When to Use This Skill

Use this skill when:
- Creating a new manga/comic source for Venera
- Fixing broken source configurations due to website API changes
- Updating existing sources with new features
- Converting other source formats to Venera format
- Debugging source configuration issues
- Adding user-configurable options to existing sources
- Implementing authentication for sources that require login

## Workflow Guidance

### Creating a New Source

1. **Initialize Source File**
   ```bash
   python scripts/create_source.py --name "MyMangaSource" --key "my_manga" --url "https://mymanga.com"
   ```
   Or manually copy `assets/template.js` to `your_source.js`

2. **Configure Core Properties**
   - Update `name`, `key`, `version`, `minAppVersion`, `url`
   - Set `description` and `icon` if available
   - Configure `lang` (language code) and `timezone` if needed

3. **Implement API Integration**
   - Reference `references/venera_api.md` for Network API usage
   - Use `references/common_patterns.md` for standard implementation patterns
   - Check `assets/example_sources/` for real-world examples

4. **Test and Validate**
   ```bash
   python scripts/validate_source.py your_source.js
   ```

### Fixing Existing Sources

1. **Diagnose the Issue**
   - Check for API endpoint changes
   - Verify response parsing logic
   - Test authentication if applicable

2. **Apply Fixes**
   ```bash
   python scripts/fix_api_endpoints.py problematic_source.js
   ```
   - Update API URLs and headers
   - Adjust parsing functions for new response formats
   - Fix authentication flow if broken

3. **Validate Fixes**
   ```bash
   python scripts/validate_source.py fixed_source.js
   ```

### Actual Implementation Patterns from MangaDex Example

#### Standard API Call Pattern (Using Venera's Network API)
```javascript
async function fetchComics(endpoint, params = {}) {
    try {
        const response = await Network.sendRequest(
            'GET',
            endpoint,
            {}, // headers
            null, // data (null for GET requests)
            params // extra parameters
        );
        
        const data = JSON.parse(Convert.decodeUtf8(response));
        return data.results || data.data || [];
    } catch (error) {
        console.error('API call failed:', error);
        throw new Error(`Failed to fetch comics: ${error.message}`);
    }
}
```

#### Comic Parsing Function (Real Example)
```javascript
function parseComic(rawData) {
    // Extract titles and select based on user locale
    let titles = extractTitles(rawData);
    let locale = APP.locale;
    let mainTitle = selectTitleByLocale(titles, locale);
    
    return Comic({
        id: String(rawData.id),
        title: mainTitle,
        subtitle: extractAuthors(rawData)[0] || '',
        cover: extractCoverUrl(rawData, rawData.id),
        tags: extractTags(rawData),
        description: rawData.attributes?.description?.en || '',
        maxPage: 0,
        language: 'en',
        favoriteId: '',
        stars: 0
    });
}
```

#### Search Implementation (Using Actual Venera API)
```javascript
class MyComicSource extends ComicSource {
    // ... other properties
    
    baseUrl = 'https://example.com';
    apiBaseUrl = 'https://api.example.com';
    
    async search(keyword, page) {
        const endpoint = `${this.apiBaseUrl}/search`;
        const response = await Network.sendRequest(
            'GET',
            endpoint,
            {},
            null,
            { q: keyword, page: page || 1, limit: this.comicsPerPage }
        );
        
        const data = JSON.parse(Convert.decodeUtf8(response));
        return data.results.map(item => this.parseComic(item));
    }
    
    parseComic(raw) {
        // Actual parsing logic here
        return Comic({
            id: String(raw.id),
            title: raw.title,
            subtitle: raw.author,
            cover: raw.cover_url,
            tags: raw.genres || [],
            description: raw.description || '',
            maxPage: raw.total_chapters || 0,
            language: raw.language || 'en',
            favoriteId: '',
            stars: raw.rating || 0
        });
    }
}
```

#### Chapter Map Creation (Required Structure)
```javascript
async function fetchChapters(comicId) {
    const response = await Network.sendRequest(
        'GET',
        `${this.apiBaseUrl}/comic/${comicId}/chapters`,
        {},
        null,
        { limit: 500, order: 'asc' }
    );
    
    const data = JSON.parse(Convert.decodeUtf8(response));
    const chapters = new Map();
    
    for (const chapter of data.results || []) {
        const chapterId = chapter.id;
        const chapterNum = chapter.chapter;
        const title = chapter.title;
        const displayTitle = title ? `${chapterNum}: ${title}` : `Chapter ${chapterNum}`;
        
        const volume = chapter.volume;
        const volumeName = volume ? `Volume ${volume}` : "No Volume";
        
        if (!chapters.get(volumeName)) {
            chapters.set(volumeName, new Map());
        }
        
        chapters.get(volumeName).set(chapterId, displayTitle);
    }
    
    return chapters;
}
```

## Resource Usage

### Scripts (`scripts/`)
- `create_source.py`: Generate new source from template with interactive prompts
- `validate_source.js`: Validate source file structure and required methods
- `fix_api_endpoints.py`: Automatically detect and fix broken API endpoints

### References (`references/`)
- `venera_api.md`: Complete Network API documentation with examples
- `data_models.md`: Detailed Comic, ComicDetails, Comment model specifications
- `common_patterns.md`: Implementation patterns for search, explore, categories, etc.
- `authentication.md`: OAuth, cookie-based, and credential authentication patterns

### Assets (`assets/`)
- `template.js`: Complete Venera source template with all optional methods
- `example_sources/`: Working examples from popular manga sites
- `cheatsheet.md`: Quick reference for method signatures and patterns
- `validation_rules.json`: JSON schema for source validation

## Best Practices

### File Organization
- One source per `.js` file
- Files can be placed in any directory according to project needs
- When no specific location is specified, default to project root
- Use kebab-case for filenames (e.g., `my_manga_source.js`)
- Class names should be descriptive (e.g., `MyMangaComicSource`)
- Keep source keys unique and consistent

### Error Handling
- Always wrap network calls in try-catch blocks
- Provide user-friendly error messages
- Handle pagination and rate limiting gracefully
- Validate API responses before parsing

### Performance
- Implement proper pagination for large result sets
- Cache frequently accessed data when appropriate
- Use efficient parsing functions
- Minimize unnecessary API calls

### Maintenance
- Document API endpoints and response formats
- Include source version in configuration
- Test with different Venera app versions
- Monitor for breaking website changes

## Quick Start Examples

### Create a Basic Source
```bash
python scripts/create_source.py \
  --name "MangaDex" \
  --key "mangadex" \
  --url "https://api.mangadex.org" \
  --output ./sources/mangadex.js  # Can be any directory
```

### Validate Source Structure
```bash
python scripts/validate_source.py mangadex.js
```

### Fix Common Issues
```bash
python scripts/fix_api_endpoints.py \
  --input broken_source.js \
  --output fixed_source.js \
  --test-endpoints
```

## Troubleshooting

### Common Issues and Solutions

1. **Network API Not Working**
   - Check if `Network` object is available in global scope
   - Verify CORS headers on target website
   - Use appropriate authentication headers

2. **Data Parsing Errors**
   - Validate response structure before parsing
   - Handle missing or null fields gracefully
   - Use type conversion for numeric IDs

3. **Authentication Failures**
   - Check cookie persistence with `Network.setCookies()`
   - Verify OAuth token refresh logic
   - Test with different authentication methods

4. **Performance Issues**
   - Implement pagination correctly
   - Cache expensive operations
   - Optimize image loading configurations

For detailed troubleshooting, consult the reference documents and example sources.