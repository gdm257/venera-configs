# Common Implementation Patterns

Standard patterns and best practices for Venera source development.

## Search Implementation

### Basic Search Pattern
```javascript
class ExampleSource extends ComicSource {
  async search(keyword, page = 1) {
    try {
      const response = await Network.get(`${this.url}/api/search`, {
        params: {
          q: keyword,
          page: page,
          limit: 20
        },
        headers: {
          'User-Agent': 'Venera/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      // Parse search results
      return response.data.results.map(item => this.parseComic(item));
    } catch (error) {
      throw new Error(`Search error: ${error.message}`);
    }
  }
  
  parseComic(raw) {
    return new Comic({
      id: String(raw.id),
      title: raw.title,
      cover: raw.cover_url,
      tags: raw.tags || [],
      description: raw.description || '',
      author: raw.author || '',
      status: this.mapStatus(raw.status),
      updateTime: new Date(raw.updated_at).getTime()
    });
  }
}
```

### Advanced Search with Filters
```javascript
async search(keyword, page = 1, filters = {}) {
  const params = {
    q: keyword,
    page: page,
    limit: 20
  };
  
  // Apply filters
  if (filters.genres && filters.genres.length > 0) {
    params.genres = filters.genres.join(',');
  }
  
  if (filters.status) {
    params.status = filters.status;
  }
  
  if (filters.sort) {
    params.sort = filters.sort; // 'popular', 'latest', 'rating'
  }
  
  const response = await Network.get(`${this.url}/api/search`, { params });
  
  // Handle pagination metadata
  return {
    comics: response.data.results.map(this.parseComic),
    hasNext: response.data.has_next || false,
    total: response.data.total || 0
  };
}
```

## Explore/Browse Implementation

### Category-based Explore
```javascript
class ExampleSource extends ComicSource {
  async explore(page = 1) {
    // Get default or popular comics
    return await this.category('popular', page);
  }
  
  async category(categoryId, page = 1) {
    const endpoint = this.getCategoryEndpoint(categoryId);
    const response = await Network.get(endpoint, {
      params: { page, limit: 24 }
    });
    
    return response.data.results.map(this.parseComic);
  }
  
  getCategoryEndpoint(categoryId) {
    const endpoints = {
      'popular': `${this.url}/api/popular`,
      'latest': `${this.url}/api/latest`,
      'trending': `${this.url}/api/trending`,
      'completed': `${this.url}/api/completed`
    };
    
    return endpoints[categoryId] || `${this.url}/api/category/${categoryId}`;
  }
}
```

### Explore with Multiple Sections
```javascript
async explore(page = 1) {
  // Fetch multiple sections in parallel
  const [popular, latest, trending] = await Promise.all([
    this.fetchSection('popular', page),
    this.fetchSection('latest', page),
    this.fetchSection('trending', page)
  ]);
  
  return {
    sections: [
      { title: 'Popular This Week', comics: popular },
      { title: 'New Releases', comics: latest },
      { title: 'Trending Now', comics: trending }
    ]
  };
}
```

## Comic Details Implementation

### Complete Details Loading
```javascript
class ExampleSource extends ComicSource {
  async comic.loadInfo(comicId) {
    try {
      // Load comic info and episodes in parallel
      const [infoResponse, episodesResponse] = await Promise.all([
        Network.get(`${this.url}/api/comics/${comicId}`),
        Network.get(`${this.url}/api/comics/${comicId}/episodes`, {
          params: { page: 1, limit: 50 }
        })
      ]);
      
      const info = infoResponse.data;
      const episodes = episodesResponse.data.results;
      
      // Load related comics if available
      let related = [];
      if (info.related_ids && info.related_ids.length > 0) {
        const relatedResponse = await Network.get(`${this.url}/api/comics/batch`, {
          params: { ids: info.related_ids.join(',') }
        });
        related = relatedResponse.data.results.map(this.parseComic);
      }
      
      return new ComicDetails({
        id: String(info.id),
        title: info.title,
        cover: info.cover_image,
        tags: info.genres.map(g => g.name),
        description: info.description,
        author: info.authors.map(a => a.name).join(', '),
        status: this.mapStatus(info.status),
        updateTime: new Date(info.updated_at).getTime(),
        episodes: episodes.map(this.parseEpisode),
        related: related,
        alternativeTitles: info.alternative_titles || [],
        publisher: info.publisher?.name || '',
        year: info.publication_year,
        volumes: info.total_volumes,
        chapters: info.total_chapters
      });
    } catch (error) {
      throw new Error(`Failed to load comic details: ${error.message}`);
    }
  }
  
  parseEpisode(raw) {
    return new Episode({
      id: String(raw.id),
      title: raw.title || `Chapter ${raw.chapter_number}`,
      order: raw.chapter_number || raw.order,
      uploadTime: new Date(raw.uploaded_at).getTime(),
      pages: this.parsePages(raw.pages),
      volume: raw.volume_number,
      chapter: raw.chapter_number,
      language: raw.language || 'en'
    });
  }
  
  parsePages(pageUrls) {
    return pageUrls.map((url, index) => new Page({
      id: `page-${index + 1}`,
      url: url,
      order: index + 1
    }));
  }
}
```

## Episode Loading Implementation

### Standard Episode Loading
```javascript
async comic.loadEp(episodeId) {
  try {
    const response = await Network.get(`${this.url}/api/episodes/${episodeId}`);
    const episodeData = response.data;
    
    return new Episode({
      id: String(episodeData.id),
      title: episodeData.title,
      order: episodeData.order,
      uploadTime: new Date(episodeData.uploaded_at).getTime(),
      pages: this.parsePages(episodeData.pages),
      volume: episodeData.volume,
      chapter: episodeData.chapter,
      translator: episodeData.translator,
      scanlator: episodeData.scanlator
    });
  } catch (error) {
    throw new Error(`Failed to load episode: ${error.message}`);
  }
}
```

### Batch Episode Loading
```javascript
async comic.loadEp(episodeId) {
  // For sources that require comic context
  const comicId = this.extractComicId(episodeId);
  const allEpisodes = await this.loadAllEpisodes(comicId);
  
  // Find specific episode
  const episode = allEpisodes.find(ep => ep.id === episodeId);
  if (!episode) {
    throw new Error(`Episode ${episodeId} not found`);
  }
  
  return episode;
}
```

## Authentication Patterns

### Cookie-based Authentication
```javascript
class AuthSource extends ComicSource {
  async account.login(credentials) {
    const response = await Network.post(`${this.url}/auth/login`, credentials);
    
    // Extract and set cookies
    const cookies = response.headers['set-cookie'];
    if (cookies) {
      Network.setCookies(cookies, this.url);
    }
    
    // Save credentials for session refresh
    this.saveData('credentials', credentials);
    
    return { success: true, user: response.data.user };
  }
  
  async account.logout() {
    await Network.post(`${this.url}/auth/logout`);
    Network.deleteCookies(this.url);
    this.deleteData('credentials');
    return { success: true };
  }
  
  async account.checkLogin() {
    try {
      const response = await Network.get(`${this.url}/auth/me`);
      return { loggedIn: true, user: response.data };
    } catch (error) {
      return { loggedIn: false };
    }
  }
}
```

### Token-based Authentication
```javascript
class TokenSource extends ComicSource {
  constructor() {
    super();
    this.token = this.loadData('auth_token');
  }
  
  async account.login(credentials) {
    const response = await Network.post(`${this.url}/oauth/token`, {
      grant_type: 'password',
      ...credentials
    });
    
    this.token = response.data.access_token;
    this.saveData('auth_token', this.token);
    
    // Set default authorization header
    Network.setHeaders({
      'Authorization': `Bearer ${this.token}`
    });
    
    return { success: true, token: this.token };
  }
  
  async makeAuthenticatedRequest(endpoint) {
    if (!this.token) {
      throw new Error('Not authenticated');
    }
    
    return await Network.get(endpoint, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
  }
}
```

## Configuration Options

### User Options Pattern
```javascript
class ConfigurableSource extends ComicSource {
  optionList() {
    return [
      {
        key: 'sort_by',
        title: 'Sort By',
        type: 'select',
        options: [
          { label: 'Popularity', value: 'popular' },
          { label: 'Latest', value: 'latest' },
          { label: 'Rating', value: 'rating' }
        ],
        defaultValue: 'popular'
      },
      {
        key: 'language_filter',
        title: 'Language',
        type: 'select',
        options: [
          { label: 'English', value: 'en' },
          { label: 'Japanese', value: 'ja' },
          { label: 'All', value: 'all' }
        ],
        defaultValue: 'en'
      },
      {
        key: 'adult_content',
        title: 'Show Adult Content',
        type: 'switch',
        defaultValue: false
      }
    ];
  }
  
  optionLoader() {
    return {
      sort_by: this.loadData('sort_by') || 'popular',
      language_filter: this.loadData('language_filter') || 'en',
      adult_content: this.loadData('adult_content') || false
    };
  }
  
  async search(keyword, page = 1) {
    const options = this.optionLoader();
    const params = {
      q: keyword,
      page: page,
      sort: options.sort_by,
      language: options.language_filter,
      adult: options.adult_content
    };
    
    // Use options in API call
    return await Network.get(`${this.url}/api/search`, { params });
  }
}
```

## Error Handling Patterns

### Comprehensive Error Handling
```javascript
async function safeApiCall(endpoint, options = {}) {
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await Network.get(endpoint, options);
      
      // Check HTTP status
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        error.status = response.status;
        error.data = response.data;
        throw error;
      }
      
      // Validate response structure
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format');
      }
      
      return response.data;
      
    } catch (error) {
      lastError = error;
      
      // Retry logic
      if (attempt < maxRetries) {
        const delay = 1000 * Math.pow(2, attempt - 1); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }
  
  // Format final error
  if (lastError.status === 404) {
    throw new Error('Resource not found');
  } else if (lastError.status === 401) {
    throw new Error('Authentication required');
  } else if (lastError.status >= 500) {
    throw new Error('Server error, please try again later');
  } else if (lastError.message.includes('timeout')) {
    throw new Error('Request timed out');
  } else if (lastError.message.includes('network')) {
    throw new Error('Network connection failed');
  }
  
  throw new Error(`API request failed: ${lastError.message}`);
}
```

## Performance Optimization

### Caching Strategy
```javascript
class CachedSource extends ComicSource {
  constructor() {
    super();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }
  
  async getWithCache(endpoint, forceRefresh = false) {
    const cacheKey = endpoint;
    const cached = this.cache.get(cacheKey);
    
    // Return cached data if valid
    if (!forceRefresh && cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    // Fetch fresh data
    const data = await Network.get(endpoint);
    
    // Update cache
    this.cache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
    
    return data;
  }
  
  clearCache() {
    this.cache.clear();
  }
  
  async search(keyword, page = 1) {
    const cacheKey = `search:${keyword}:${page}`;
    return this.getWithCache(
      `${this.url}/api/search?q=${keyword}&page=${page}`,
      false // Use cache for searches
    );
  }
}
```

### Efficient Pagination
```javascript
async function fetchPaginated(endpoint, page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;
  
  const response = await Network.get(endpoint, {
    params: {
      offset: offset,
      limit: pageSize
    }
  });
  
  const total = response.data.total || response.data.count || 0;
  const items = response.data.results || response.data.items || [];
  
  return {
    items: items,
    currentPage: page,
    totalPages: Math.ceil(total / pageSize),
    totalItems: total,
    hasNext: page * pageSize < total
  };
}
```

These patterns provide reusable solutions for common Venera source implementation challenges. Adapt them to specific website APIs while maintaining consistency with Venera's data models and error handling standards.