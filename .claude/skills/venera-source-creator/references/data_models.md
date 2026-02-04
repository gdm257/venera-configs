# Venera Data Models

Complete reference for all data models used in Venera source configurations.

**Important**: These are actual constructor functions available in the Venera JavaScript environment (`init.js`). Do not use `new Comic()` - these are constructor functions that should be called directly.

## Comic Object

The primary data model for representing manga/comic entries in lists (search results, popular, latest).

### Constructor
```javascript
Comic({
  id: string,
  title: string,
  subtitle?: string,
  subTitle?: string, // equal to subtitle
  cover: string,
  tags: string[],
  description: string,
  maxPage?: number,
  language?: string,
  favoriteId?: string,
  stars?: number // 0-5, double
})
```

### Properties
| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier (from source website) |
| `title` | string | ✅ | Display title |
| `subtitle` | string | ❌ | Secondary title (often author name) |
| `subTitle` | string | ❌ | Alias for subtitle |
| `cover` | string | ✅ | URL to cover image |
| `tags` | string[] | ✅ | Array of genre/tag strings |
| `description` | string | ✅ | Summary/description text |
| `maxPage` | number | ❌ | Maximum page count |
| `language` | string | ❌ | Content language |
| `favoriteId` | string | ❌ | Favorite identifier |
| `stars` | number | ❌ | Rating (0-5, double precision) |

### Example from MangaDex
```javascript
function parseComic(data) {
  // Extract data from API response
  let id = data['id'];
  let titles = extractTitles(data);
  let locale = APP.locale;
  let mainTitle = selectTitleByLocale(titles, locale);
  
  let tags = [];
  for (let tag of data['attributes']['tags']) {
    tags.push(tag['attributes']['name']['en']);
  }
  
  let cover = extractCoverUrl(data, id);
  let description = data['attributes']['description']['en'];
  
  return Comic({
    id: id,
    title: mainTitle,
    subtitle: extractAuthors(data)[0], // First author
    cover: cover,
    tags: tags,
    description: description,
    createTime: data['attributes']['createdAt'],
    updateTime: data['attributes']['updatedAt'],
    status: data['attributes']['status']
  });
}
```

## ComicDetails Object

Extended information for individual comic details view.

### Constructor
```javascript
ComicDetails({
  title: string,
  subtitle?: string,
  subTitle?: string, // equal to subtitle
  cover: string,
  description?: string,
  tags: Map<string, string[]> | {} | null | undefined,
  chapters: Map<string, string> | {} | null | undefined, // key: chapter id, value: chapter title
  isFavorite?: boolean | null | undefined,
  subId?: string, // parameter passed to comments API
  thumbnails?: string[], // for multiple page thumbnails, set to null and use `loadThumbnails` API
  recommend?: Comic[], // related comics
  commentCount?: number,
  likesCount?: number,
  isLiked?: boolean,
  uploader?: string,
  updateTime?: string,
  uploadTime?: string,
  url?: string,
  stars?: number, // 0-5, double
  maxPage?: number,
  comments?: Comment[] // since 1.0.7 - app displays comments in details page
})
```

### Key Properties
| Property | Type | Description |
|----------|------|-------------|
| `title` | string | Display title |
| `subtitle` | string | Secondary title (often author name) |
| `cover` | string | URL to cover image |
| `description` | string | Summary/description text |
| `tags` | Map<string, string[]> | Organized tags (e.g., `{"Tags": ["Action", "Adventure"], "Status": ["Ongoing"]}`) |
| `chapters` | Map<string, string> | Chapter structure: volume -> Map<chapterId, chapterTitle> |
| `recommend` | Comic[] | Related/similar comics |
| `stars` | number | Rating (0-5, double precision) |
| `comments` | Comment[] | User comments (supported since v1.0.7) |

### Chapter Structure Example
```javascript
// chapters should be a Map where:
// - Keys are volume names (e.g., "Volume 1", "No Volume")
// - Values are Maps of chapter id -> chapter title
let chapters = new Map();
chapters.set("Volume 1", new Map([
  ["chapter-123", "Chapter 1: Beginning"],
  ["chapter-124", "Chapter 2: Journey"]
]));
chapters.set("No Volume", new Map([
  ["chapter-125", "Chapter 3: Conclusion"]
]));
```

### Example from MangaDex
```javascript
async function loadInfo(id) {
  let [comic, chapters, stats] = await Promise.all([
    this.comic.getComic(id),
    this.comic.getChapters(id),
    this.comic.getStats(id)
  ]);
  
  return ComicDetails({
    id: comic.id,
    title: comic.title,
    subtitle: comic.subtitle,
    cover: comic.cover,
    tags: {
      "Tags": comic.tags,
      "Status": comic.status,
      "Authors": comic.authors,
      "Artists": comic.artists,
    },
    description: comic.description,
    updateTime: comic.updateTime,
    uploadTime: comic.createTime,
    status: comic.status,
    chapters: chapters,
    stars: (stats.rating || 0) / 2, // Convert 0-10 scale to 0-5
    url: `https://mangadex.org/title/${comic.id}`,
  });
}

// getChapters implementation
async function getChapters(id) {
  let res = await fetch(`https://api.mangadex.org/manga/${id}/feed?limit=500&translatedLanguage[]=en&order[chapter]=asc`);
  let data = await res.json();
  let chapters = new Map();
  
  for (let chapter of data['data']) {
    let chapterId = chapter['id'];
    let chapterNum = chapter['attributes']['chapter'];
    let title = chapter['attributes']['title'];
    let displayTitle = title ? `${chapterNum}: ${title}` : chapterNum;
    let volume = chapter['attributes']['volume'];
    let volumeName = volume ? `Volume ${volume}` : "No Volume";
    
    if (!chapters.get(volumeName)) {
      chapters.set(volumeName, new Map());
    }
    chapters.get(volumeName).set(chapterId, displayTitle);
  }
  
  return chapters;
}
```

## Comment Object

User comments and discussions.

### Constructor
```javascript
Comment({
  userName: string,
  avatar?: string,
  content: string,
  time?: string,
  replyCount?: number,
  id?: string,
  isLiked?: boolean,
  score?: number,
  voteStatus?: number // 1: upvote, -1: downvote, 0: none
})
```

### Properties
| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `userName` | string | ✅ | Display username |
| `avatar` | string | ❌ | User avatar URL |
| `content` | string | ✅ | Comment text |
| `time` | string | ❌ | Comment timestamp (string format) |
| `replyCount` | number | ❌ | Number of replies |
| `id` | string | ❌ | Comment identifier |
| `isLiked` | boolean | ❌ | Whether user liked this comment |
| `score` | number | ❌ | Score/rating |
| `voteStatus` | number | ❌ | Vote status: 1=upvote, -1=downvote, 0=none |

### Example
```javascript
function parseComment(raw) {
  return Comment({
    userName: raw.user?.name || "Anonymous",
    avatar: raw.user?.avatar,
    content: raw.text || raw.content,
    time: raw.created_at,
    replyCount: raw.reply_count,
    id: raw.id,
    score: raw.score || 0,
    voteStatus: raw.vote_status || 0
  });
}
```

## ImageLoadingConfig Object

Configuration for image loading, used in `onImageLoad` and `onThumbnailLoad` callbacks.

### Constructor
```javascript
ImageLoadingConfig({
  url?: string,
  method?: string, // HTTP method, uppercase
  data?: any, // request data, may be null
  headers?: Object, // request headers
  onResponse?: (ArrayBuffer) => ArrayBuffer, // modify response data
  modifyImage?: string, // JS script string for image modification
  onLoadFailed?: () => ImageLoadingConfig // called when image loading failed
})
```

### Key Properties
| Property | Type | Description |
|----------|------|-------------|
| `url` | string | Image URL to load |
| `method` | string | HTTP method (GET, POST, etc.) |
| `data` | any | Request payload |
| `headers` | Object | HTTP headers |
| `onResponse` | function | Transform response data |
| `modifyImage` | string | JS script to modify image in separate isolate |
| `onLoadFailed` | function | Fallback config if loading fails |

### Example
```javascript
function onImageLoad(config) {
  // Add authentication headers
  config.headers = {
    ...config.headers,
    "Authorization": "Bearer " + this.authToken
  };
  
  // Modify response if needed
  config.onResponse = (buffer) => {
    // Decrypt or transform image data
    return this.decryptImage(buffer);
  };
  
  return config;
}
```

## Note: Episodes and Pages

Venera does not have dedicated `Episode` or `Page` constructor functions. Instead:

### Chapter/Episode Handling
- Chapters are stored in `ComicDetails.chapters` as a Map structure
- Episode loading is done through the `loadEp` method which returns `{images: string[]}`
- Each image URL in the array represents a page

### Example Episode Loading
```javascript
async function loadEp(comicId, chapterId) {
  let res = await fetch(`https://api.example.com/chapter/${chapterId}/images`);
  let data = await res.json();
  
  return {
    images: data.pages.map(page => page.url)
  };
}
```

### Properties
| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | ✅ | Episode identifier |
| `title` | string | ✅ | Episode title |
| `order` | number | ✅ | Episode number/order |
| `uploadTime` | number | ✅ | Upload timestamp (ms) |
| `pages` | Page[] | ✅ | Array of page objects |
| `volume` | number | ❌ | Volume number |
| `chapter` | number | ❌ | Chapter number |
| `translator` | string | ❌ | Translation group |
| `scanlator` | string | ❌ | Scanlation group |
| `language` | string | ❌ | Language code: `'en'`, `'ja'`, etc. |
| `quality` | string | ❌ | Image quality: `'low'`, `'medium'`, `'high'` |
| `size` | number | ❌ | Total file size in bytes |
| `isPreview` | boolean | ❌ | Whether episode is preview/free |
| `price` | number | ❌ | Purchase price (if not free) |

### Example
```javascript
function parseEpisode(raw) {
  return new Episode({
    id: String(raw.id),
    title: raw.title || `Chapter ${raw.chapter_number}`,
    order: raw.chapter_number || raw.order,
    uploadTime: new Date(raw.uploaded_at).getTime(),
    pages: raw.pages.map((url, index) => new Page({
      id: `${raw.id}-${index + 1}`,
      url: url,
      order: index + 1
    })),
    volume: raw.volume_number,
    chapter: raw.chapter_number,
    translator: raw.translation_group,
    language: raw.language || 'en',
    isPreview: raw.is_preview || false
  });
}
```

## Page Object

Individual page within an episode.

### Constructor
```javascript
new Page({
  id: string,
  url: string,
  order: number
})
```

### Properties
| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | ✅ | Page identifier |
| `url` | string | ✅ | Image URL |
| `order` | number | ✅ | Page number/order |
| `width` | number | ❌ | Image width in pixels |
| `height` | number | ❌ | Image height in pixels |
| `format` | string | ❌ | Image format: `'jpg'`, `'png'`, `'webp'` |
| `estimatedSize` | number | ❌ | Estimated file size |

## Validation and Best Practices

### Required Properties Checklist
When creating `Comic` or `ComicDetails` objects, ensure these properties are set:

**Comic (for lists):**
- ✅ `id` - Unique string identifier
- ✅ `title` - Display title  
- ✅ `cover` - Valid image URL
- ✅ `tags` - Array of tag strings or organized Map
- ✅ `description` - Summary text (can be empty string)

**ComicDetails (for detail view):**
- ✅ `title` - Display title
- ✅ `cover` - Valid image URL
- ✅ `chapters` - Map structure for chapter organization
- ✅ `tags` - Organized Map with categories
- ✅ `description` - Detailed summary

### Common Validation Issues

#### 1. Missing Required Properties
```javascript
// ❌ WRONG - Missing required properties
Comic({ id: "123", title: "My Comic" });

// ✅ CORRECT - All required properties included
Comic({
  id: "123",
  title: "My Comic",
  cover: "https://example.com/cover.jpg",
  tags: ["Action", "Adventure"],
  description: "A great comic"
});
```

#### 2. Incorrect Chapter Structure
```javascript
// ❌ WRONG - Using array instead of Map
ComicDetails({
  chapters: [
    { id: "ch1", title: "Chapter 1" },
    { id: "ch2", title: "Chapter 2" }
  ]
});

// ✅ CORRECT - Proper Map structure
let chapters = new Map();
chapters.set("No Volume", new Map([
  ["ch1", "Chapter 1: Beginning"],
  ["ch2", "Chapter 2: Journey"]
]));
ComicDetails({ chapters: chapters });
```

#### 3. Tag Organization
```javascript
// ❌ WRONG - Flat array without categories
ComicDetails({
  tags: ["Action", "Adventure", "Ongoing", "Author Name"]
});

// ✅ CORRECT - Organized by category
ComicDetails({
  tags: {
    "Genres": ["Action", "Adventure"],
    "Status": ["Ongoing"],
    "Authors": ["Author Name"]
  }
});
```

### Helper Functions

#### 1. Safe Comic Creation
```javascript
function createComic(data) {
  // Ensure required properties exist
  const defaults = {
    id: "",
    title: "",
    cover: "",
    tags: [],
    description: "",
    subtitle: "",
    subTitle: "",
    maxPage: 0,
    language: "en",
    favoriteId: "",
    stars: 0
  };
  
  return Comic({
    ...defaults,
    ...data,
    // Ensure arrays are properly initialized
    tags: Array.isArray(data.tags) ? data.tags : []
  });
}
```

#### 2. Chapter Map Builder
```javascript
function buildChapterMap(chapterList) {
  const chapterMap = new Map();
  
  // Group by volume or use "No Volume" as default
  const volumeMap = new Map();
  
  for (const chapter of chapterList) {
    const volumeName = chapter.volume ? `Volume ${chapter.volume}` : "No Volume";
    
    if (!volumeMap.has(volumeName)) {
      volumeMap.set(volumeName, new Map());
    }
    
    const chapterTitle = chapter.title 
      ? `Chapter ${chapter.number}: ${chapter.title}`
      : `Chapter ${chapter.number}`;
    
    volumeMap.get(volumeName).set(chapter.id, chapterTitle);
  }
  
  // Convert to the required structure
  for (const [volumeName, chapters] of volumeMap) {
    chapterMap.set(volumeName, chapters);
  }
  
  return chapterMap;
}
```

#### 3. Tag Organizer
```javascript
function organizeTags(rawTags, authors, status) {
  const tags = {};
  
  // Organize by category
  if (Array.isArray(rawTags) && rawTags.length > 0) {
    tags["Genres"] = rawTags;
  }
  
  if (authors && authors.length > 0) {
    tags["Authors"] = authors;
  }
  
  if (status) {
    tags["Status"] = [status];
  }
  
  return tags;
}
```

## Performance Considerations

### 1. Chapter Map Size
- Limit chapters per volume to 500-1000 for performance
- Consider pagination for comics with many chapters
- Use lazy loading for chapter details when possible

### 2. Image Loading
- Return direct image URLs in `loadEp` for fastest loading
- Use `onImageLoad` callback for authentication or transformation
- Consider using `modifyImage` script for complex image processing

### 3. Caching Strategy
- Cache comic lists with appropriate TTL based on update frequency
- Cache chapter structures since they change less frequently
- Implement cache invalidation when comic details update

## Debugging Tips

### 1. Check Console Output
```javascript
// Add debugging to see what data is being created
console.log("Creating Comic:", data);
const comic = Comic(data);
console.log("Created Comic:", comic);
return comic;
```

### 2. Validate Structure
```javascript
function validateComicDetails(details) {
  const errors = [];
  
  if (!details.title) errors.push("Missing title");
  if (!details.cover) errors.push("Missing cover URL");
  if (!details.chapters || !(details.chapters instanceof Map)) {
    errors.push("Invalid chapter structure");
  }
  
  if (errors.length > 0) {
    console.error("ComicDetails validation errors:", errors);
    throw new Error(`Invalid ComicDetails: ${errors.join(", ")}`);
  }
  
  return details;
}
```

These data models and patterns ensure compatibility with Venera's JavaScript runtime. Always refer to the actual `init.js` file for the most up-to-date API definitions.