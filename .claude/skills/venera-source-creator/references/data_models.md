# Venera Data Models

Complete reference for all data models used in Venera source configurations.

## Comic Object

The primary data model for representing manga/comic entries.

### Constructor
```javascript
new Comic({
  id: string,
  title: string,
  cover: string,
  tags: string[],
  description: string,
  author: string,
  status: string,
  updateTime: number
})
```

### Properties
| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier (from source website) |
| `title` | string | ✅ | Display title |
| `cover` | string | ✅ | URL to cover image |
| `tags` | string[] | ✅ | Array of genre/tag strings |
| `description` | string | ✅ | Summary/description text |
| `author` | string | ❌ | Author/artist name(s) |
| `status` | string | ❌ | Publication status: `'ongoing'`, `'completed'`, `'hiatus'`, `'cancelled'` |
| `updateTime` | number | ❌ | Last update timestamp (milliseconds) |
| `popularity` | number | ❌ | Popularity score for sorting |
| `rating` | number | ❌ | Average user rating (0-5) |
| `viewCount` | number | ❌ | Total view count |
| `commentCount` | number | ❌ | Number of comments |
| `favoriteCount` | number | ❌ | Number of user favorites |
| `episodeCount` | number | ❌ | Total number of episodes/chapters |
| `lastEpisode` | string | ❌ | Title of most recent episode |
| `isFree` | boolean | ❌ | Whether content is free to access |
| `isExclusive` | boolean | ❌ | Whether content is exclusive to platform |
| `adult` | boolean | ❌ | Adult/NSFW content flag |

### Methods
```javascript
// Get formatted update time
comic.getUpdateTime(format = 'relative') // '2 days ago'

// Check if comic matches filters
comic.matchesFilter(filter) // boolean

// Convert to plain object
comic.toJSON() // { id, title, cover, ... }
```

### Example
```javascript
function parseComic(raw) {
  return new Comic({
    id: String(raw.id),
    title: raw.title || raw.name,
    cover: raw.cover_url || raw.thumbnail,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    description: raw.description || raw.summary || '',
    author: raw.author || raw.artist || '',
    status: this.mapStatus(raw.status),
    updateTime: new Date(raw.updated_at).getTime(),
    popularity: raw.popularity_score || 0,
    rating: parseFloat(raw.rating) || 0,
    episodeCount: raw.total_chapters || 0,
    lastEpisode: raw.latest_chapter || '',
    adult: raw.is_adult || false
  });
}

// Status mapping helper
mapStatus(rawStatus) {
  const statusMap = {
    'ongoing': 'ongoing',
    'completed': 'completed',
    'hiatus': 'hiatus',
    'cancelled': 'cancelled',
    'finished': 'completed',
    'publishing': 'ongoing'
  };
  return statusMap[rawStatus?.toLowerCase()] || 'unknown';
}
```

## ComicDetails Object

Extended information for individual comic details view.

### Constructor
```javascript
new ComicDetails({
  id: string,
  title: string,
  cover: string,
  tags: string[],
  description: string,
  author: string,
  status: string,
  updateTime: number,
  episodes: Episode[],
  related: Comic[],
  comments: Comment[]
})
```

### Extended Properties
| Property | Type | Description |
|----------|------|-------------|
| `episodes` | Episode[] | Array of episode/chapter objects |
| `related` | Comic[] | Related/similar comics |
| `comments` | Comment[] | User comments |
| `alternativeTitles` | string[] | Alternative names/translations |
| `publisher` | string | Publishing company |
| `serialization` | string | Serialization magazine |
| `year` | number | First publication year |
| `volumes` | number | Total number of volumes |
| `chapters` | number | Total number of chapters |
| `translators` | string[] | Translation group names |
| `sources` | string[] | Source websites/scanlation groups |
| `contentRating` | string | Age rating: `'all'`, `'teen'`, `'mature'`, `'adult'` |
| `downloadable` | boolean | Whether episodes can be downloaded |
| `bookmarkable` | boolean | Whether episodes support bookmarks |
| `sharable` | boolean | Whether comic can be shared |

### Example
```javascript
async function loadComicDetails(comicId) {
  const [infoResponse, episodesResponse] = await Promise.all([
    Network.get(`${this.url}/comics/${comicId}`),
    Network.get(`${this.url}/comics/${comicId}/episodes`)
  ]);
  
  const info = infoResponse.data;
  const episodes = episodesResponse.data.results;
  
  return new ComicDetails({
    id: String(info.id),
    title: info.title,
    cover: info.cover_image,
    tags: info.genres.map(g => g.name),
    description: info.description,
    author: info.authors.map(a => a.name).join(', '),
    status: this.mapStatus(info.status),
    updateTime: new Date(info.updated_at).getTime(),
    episodes: episodes.map(parseEpisode),
    related: info.related_comics.map(parseComic),
    alternativeTitles: info.alternative_titles || [],
    publisher: info.publisher?.name || '',
    year: info.publication_year,
    volumes: info.total_volumes,
    chapters: info.total_chapters,
    contentRating: info.is_adult ? 'adult' : 'teen',
    downloadable: info.download_enabled || false
  });
}
```

## Episode Object

Individual chapter/episode information.

### Constructor
```javascript
new Episode({
  id: string,
  title: string,
  order: number,
  uploadTime: number,
  pages: Page[]
})
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

## Comment Object

User comments and discussions.

### Constructor
```javascript
new Comment({
  id: string,
  userId: string,
  username: string,
  avatar: string,
  content: string,
  time: number,
  likes: number
})
```

### Properties
| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | ✅ | Comment identifier |
| `userId` | string | ✅ | User identifier |
| `username` | string | ✅ | Display username |
| `avatar` | string | ✅ | User avatar URL |
| `content` | string | ✅ | Comment text |
| `time` | number | ✅ | Comment timestamp (ms) |
| `likes` | number | ✅ | Number of likes |
| `replies` | Comment[] | ❌ | Array of reply comments |
| `isAuthor` | boolean | ❌ | Whether comment is from comic author |
| `isVerified` | boolean | ❌ | Whether user is verified |
| `userLevel` | number | ❌ | User level/rank |

## PageJumpTarget Object

Navigation targets within comic reader.

### Constructor
```javascript
new PageJumpTarget({
  id: string,
  title: string,
  page: number
})
```

### Properties
| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | ✅ | Target identifier |
| `title` | string | ✅ | Display title |
| `page` | number | ✅ | Target page number |

## Validation Rules

### Comic Validation
```javascript
function validateComic(comic) {
  const errors = [];
  
  if (!comic.id || typeof comic.id !== 'string') {
    errors.push('Comic ID must be a non-empty string');
  }
  
  if (!comic.title || typeof comic.title !== 'string') {
    errors.push('Comic title must be a non-empty string');
  }
  
  if (!comic.cover || typeof comic.cover !== 'string') {
    errors.push('Comic cover must be a valid URL string');
  }
  
  if (!Array.isArray(comic.tags)) {
    errors.push('Comic tags must be an array');
  }
  
  if (typeof comic.description !== 'string') {
    errors.push('Comic description must be a string');
  }
  
  return errors;
}
```

### Episode Validation
```javascript
function validateEpisode(episode) {
  const errors = [];
  
  if (!episode.id || typeof episode.id !== 'string') {
    errors.push('Episode ID must be a non-empty string');
  }
  
  if (!episode.title || typeof episode.title !== 'string') {
    errors.push('Episode title must be a non-empty string');
  }
  
  if (typeof episode.order !== 'number' || episode.order < 0) {
    errors.push('Episode order must be a non-negative number');
  }
  
  if (!Array.isArray(episode.pages) || episode.pages.length === 0) {
    errors.push('Episode must have at least one page');
  }
  
  return errors;
}
```

## Data Transformation Utilities

### Normalization Functions
```javascript
// Normalize comic data from various API formats
function normalizeComicData(raw, sourceFormat) {
  switch (sourceFormat) {
    case 'mangadex':
      return {
        id: raw.id,
        title: raw.attributes.title.en || raw.attributes.title.jp,
        cover: `https://uploads.mangadex.org/covers/${raw.id}/${raw.attributes.fileName}`,
        tags: raw.attributes.tags.map(tag => tag.attributes.name.en),
        description: raw.attributes.description.en || ''
      };
      
    case 'comick':
      return {
        id: raw.slug,
        title: raw.title,
        cover: `https://meo.comick.pictures/${raw.md_covers?.[0]?.b2key}`,
        tags: raw.md_comic_md_genres?.map(g => g.md_genres.name) || [],
        description: raw.desc || ''
      };
      
    default:
      // Generic normalization
      return {
        id: String(raw.id || raw.slug || ''),
        title: raw.title || raw.name || '',
        cover: raw.cover || raw.thumbnail || raw.image_url || '',
        tags: raw.tags || raw.genres || [],
        description: raw.description || raw.summary || ''
      };
  }
}
```

These data models form the foundation of all Venera source implementations. Proper usage ensures consistent data representation across all manga/comic sources while maintaining compatibility with the Venera app.