# Venera Network API Reference

Complete documentation of the global `Network` object available in Venera source configurations.

## Overview

The `Network` object provides HTTP client functionality for making requests to manga/comic websites. It handles authentication, cookies, headers, and response parsing automatically.

## Core Methods

### `Network.get(url, params = {})`
Make a GET request.

**Parameters:**
- `url` (string): Target URL
- `params` (object): Query parameters and options

**Options:**
```javascript
{
  headers: {},      // Custom headers
  params: {},       // Query parameters
  timeout: 30000,   // Request timeout in ms
  responseType: 'json' // 'json', 'text', 'arraybuffer'
}
```

**Example:**
```javascript
const response = await Network.get('https://api.manga.com/comics', {
  headers: {
    'User-Agent': 'Venera/1.0',
    'Accept': 'application/json'
  },
  params: {
    page: 1,
    limit: 20
  }
});

// Response structure
{
  ok: true,           // HTTP status 2xx
  status: 200,        // HTTP status code
  data: {},           // Parsed response body
  headers: {},        // Response headers
  config: {}          // Request configuration
}
```

### `Network.post(url, data = {}, params = {})`
Make a POST request.

**Parameters:**
- `url` (string): Target URL
- `data` (object): Request body data
- `params` (object): Request options

**Example:**
```javascript
const response = await Network.post('https://api.manga.com/login', {
  username: 'user',
  password: 'pass'
}, {
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### `Network.delete(url, params = {})`
Make a DELETE request.

**Example:**
```javascript
await Network.delete('https://api.manga.com/favorites/123');
```

## Cookie Management

### `Network.setCookies(cookies, domain)`
Set cookies for subsequent requests.

**Parameters:**
- `cookies` (string|array): Cookie string or array of cookie objects
- `domain` (string): Optional domain restriction

**Example:**
```javascript
// Set from string
Network.setCookies('session_id=abc123; user_id=456', 'manga.com');

// Set from array
Network.setCookies([
  { name: 'session_id', value: 'abc123' },
  { name: 'user_id', value: '456' }
]);
```

### `Network.deleteCookies(domain)`
Delete all cookies for a domain.

**Example:**
```javascript
Network.deleteCookies('manga.com');
```

## Response Handling

### Success Responses
```javascript
try {
  const response = await Network.get(url);
  
  if (response.ok) {
    // Process successful response
    const comics = response.data.results;
    return comics.map(parseComic);
  } else {
    throw new Error(`HTTP ${response.status}: ${response.data?.message}`);
  }
} catch (error) {
  throw new Error(`Network request failed: ${error.message}`);
}
```

### Error Handling Best Practices
```javascript
async function safeRequest(url, options = {}) {
  try {
    const response = await Network.get(url, options);
    
    if (!response.ok) {
      // Handle specific HTTP errors
      if (response.status === 401) {
        throw new Error('Authentication required');
      } else if (response.status === 404) {
        throw new Error('Resource not found');
      } else if (response.status >= 500) {
        throw new Error('Server error');
      }
      
      throw new Error(`Request failed: ${response.status}`);
    }
    
    return response.data;
  } catch (error) {
    // Re-throw with context
    if (error.message.includes('timeout')) {
      throw new Error('Request timed out');
    } else if (error.message.includes('network')) {
      throw new Error('Network connection failed');
    }
    
    throw error;
  }
}
```

## Common Patterns

### Pagination
```javascript
async function fetchPaginated(endpoint, page = 1, limit = 20) {
  const response = await Network.get(endpoint, {
    params: { page, limit }
  });
  
  return {
    items: response.data.results,
    hasNext: response.data.has_next,
    total: response.data.total
  };
}
```

### Authentication with Tokens
```javascript
class AuthSource extends ComicSource {
  constructor() {
    super();
    this.token = null;
  }
  
  async login(credentials) {
    const response = await Network.post(`${this.url}/auth/login`, credentials);
    this.token = response.data.token;
    
    // Set authorization header for future requests
    Network.setHeaders({
      'Authorization': `Bearer ${this.token}`
    });
    
    return response.data.user;
  }
}
```

### Retry Logic
```javascript
async function fetchWithRetry(url, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await Network.get(url);
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, 1000 * Math.pow(2, attempt))
        );
      }
    }
  }
  
  throw lastError;
}
```

## Configuration Options

### Headers
```javascript
// Set default headers
Network.setHeaders({
  'User-Agent': 'Venera/1.0',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9'
});

// Headers for specific request
const response = await Network.get(url, {
  headers: {
    'Referer': 'https://manga.com',
    'X-Requested-With': 'XMLHttpRequest'
  }
});
```

### Timeouts
```javascript
// Global timeout
Network.setTimeout(30000);

// Per-request timeout
const response = await Network.get(url, {
  timeout: 60000  // 60 seconds
});
```

## Image Loading

### `onImageLoad(config)`
Configure image loading behavior.

**Example:**
```javascript
onImageLoad(config) {
  // Add referer header for image requests
  config.headers['Referer'] = this.url;
  return config;
}
```

### `onThumbnailLoad(config)`
Configure thumbnail loading behavior.

**Example:**
```javascript
onThumbnailLoad(config) {
  // Resize thumbnails for better performance
  config.params = config.params || {};
  config.params.width = 200;
  config.params.height = 300;
  return config;
}
```

## Best Practices

1. **Always use try-catch** for Network calls
2. **Validate responses** before parsing
3. **Handle pagination** properly for large datasets
4. **Implement retry logic** for transient failures
5. **Set appropriate timeouts** based on API response times
6. **Use referer headers** when required by websites
7. **Cache authentication tokens** when possible
8. **Respect rate limits** and implement backoff strategies

## Common Issues and Solutions

### CORS Errors
```javascript
// Add proper headers
headers: {
  'Origin': 'https://manga.com',
  'Referer': 'https://manga.com'
}
```

### Rate Limiting
```javascript
// Implement rate limiting with exponential backoff
async function rateLimitedRequest(url) {
  const delay = Math.random() * 1000 + 500; // 500-1500ms
  await new Promise(resolve => setTimeout(resolve, delay));
  return await Network.get(url);
}
```

### Session Expiration
```javascript
// Check for session expiration and re-authenticate
if (response.status === 401) {
  await this.login(this.credentials);
  return await Network.get(url); // Retry
}
```

This API provides the foundation for all Venera source implementations. Proper usage ensures reliable integration with manga/comic websites while maintaining good performance and error resilience.