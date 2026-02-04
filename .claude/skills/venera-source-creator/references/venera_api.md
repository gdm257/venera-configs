# Venera JavaScript API Reference

Complete documentation of the global APIs available in Venera source configurations.

## Core APIs

### `Network` Object
Global HTTP client object with cookie management.

#### `Network.fetchBytes(method, url, headers, data, extra)`
Sends HTTP request and returns ArrayBuffer response.

**Parameters:**
- `method` (string): HTTP method ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')
- `url` (string): Target URL
- `headers` (object): Request headers
- `data` (any): Request data
- `extra` (object): Additional options

**Return Value:**
```javascript
{
  status: number,      // HTTP status code
  headers: {},         // Response headers
  body: ArrayBuffer    // Response body as ArrayBuffer
}
```

#### `Network.sendRequest(method, url, headers, data, extra)`
Sends HTTP request and returns string response.

**Parameters:** Same as above

**Return Value:**
```javascript
{
  status: number,      // HTTP status code
  headers: {},         // Response headers
  body: string         // Response body as string
}
```

#### Convenience Methods
```javascript
// All return Promise<{status, headers, body}>
Network.get(url, headers, extra)
Network.post(url, headers, data, extra)
Network.put(url, headers, data, extra)
Network.patch(url, headers, data, extra)
Network.delete(url, headers, extra)
```

#### Cookie Management
```javascript
// Set cookies for a specific URL
Network.setCookies(url, cookies)

// Get cookies for a specific URL  
Network.getCookies(url)

// Delete cookies for a specific URL
Network.deleteCookies(url)
```

**Cookie Object Format:**
```javascript
{
  name: string,
  value: string,
  domain: string,
  path: string,
  expires: number, // milliseconds since epoch
  httpOnly: boolean,
  secure: boolean,
  sameSite: string // 'Strict', 'Lax', 'None'
}
```

### `Convert` Object
Encoding/decoding and cryptographic utilities.

#### Text Encoding/Decoding
```javascript
Convert.encodeUtf8(str)        // string → ArrayBuffer
Convert.decodeUtf8(buffer)     // ArrayBuffer → string
Convert.encodeGbk(str)         // string → ArrayBuffer (GBK encoding)
Convert.decodeGbk(buffer)      // ArrayBuffer → string (GBK decoding)
Convert.encodeBase64(buffer)   // ArrayBuffer → base64 string
Convert.decodeBase64(str)      // base64 string → ArrayBuffer
```

#### Cryptographic Hash Functions
```javascript
Convert.md5(buffer)           // ArrayBuffer → ArrayBuffer
Convert.sha1(buffer)          // ArrayBuffer → ArrayBuffer  
Convert.sha256(buffer)        // ArrayBuffer → ArrayBuffer
Convert.sha512(buffer)        // ArrayBuffer → ArrayBuffer
```

#### HMAC (Hash-based Message Authentication Code)
```javascript
Convert.hmac(key, value, hash)           // Returns ArrayBuffer
Convert.hmacString(key, value, hash)    // Returns hex string
```

#### AES Encryption/Decryption
```javascript
// ECB mode
Convert.encryptAesEcb(value, key)      // Encrypt
Convert.decryptAesEcb(value, key)      // Decrypt

// CBC mode  
Convert.encryptAesCbc(value, key, iv)  // Encrypt
Convert.decryptAesCbc(value, key, iv)  // Decrypt
```

### `HtmlDocument` Class
HTML parsing and DOM querying.

#### Creating a Document
```javascript
const doc = new HtmlDocument(htmlString);
```

#### Query Methods
```javascript
// Select single element by CSS selector
doc.select(selector)           // Returns HtmlElement or null

// Select all elements matching CSS selector  
doc.selectAll(selector)        // Returns HtmlElement[]
```

### `HtmlElement` Class
Represents a DOM element.

#### Navigation Methods
```javascript
element.firstChild            // First child element
element.lastChild             // Last child element  
element.nextSibling           // Next sibling element
element.previousSibling       // Previous sibling element
element.parent                // Parent element
element.children              // Array of child elements
```

#### Attribute and Content Methods
```javascript
element.attr(name)            // Get attribute value
element.attrs()               // Get all attributes as object

element.text()                // Get text content
element.outerHtml()           // Get outer HTML
element.innerHtml()           // Get inner HTML
```

#### Query Methods
```javascript
element.select(selector)      // Find descendant by selector
element.selectAll(selector)   // Find all descendants by selector
```

### `HtmlNode` Class
Base class for DOM nodes.

#### Properties
```javascript
node.nodeType                // Node type (1=ELEMENT, 3=TEXT, etc.)
node.nodeName                // Node name
node.parent                  // Parent node
node.children                // Array of child nodes
```

### `Image` Class
Image processing utilities.

#### Methods
```javascript
// Create image from bytes
Image.fromBytes(bytes)       // Returns Image object

// Image operations
image.resize(width, height)  // Resize image
image.crop(x, y, w, h)       // Crop image
image.toBytes()              // Convert to ArrayBuffer
```

### `UI` Object
User interface utilities.

#### Methods
```javascript
UI.showMessage(message)      // Display toast message
UI.showDialog(title, content, options) // Show modal dialog
UI.showLoading()             // Show loading indicator
UI.hideLoading()             // Hide loading indicator
```

### `APP` Object
Application information.

#### Properties
```javascript
APP.version                  // Venera app version string
APP.locale                   // User locale (e.g., 'en', 'zh_CN', 'zh_TW')
APP.platform                 // Platform identifier
```

### Global Functions

#### `fetch(url, options)`
Browser-compatible fetch API (available since v1.2.0).

```javascript
async function fetchData() {
  const response = await fetch('https://api.example.com/data', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer token'
    }
  });
  
  const data = await response.json();
  return data;
}
```

#### `compute(func, ...args)`
Execute function in a separate isolate for heavy computation.

```javascript
const result = await compute(heavyProcessingFunction, arg1, arg2);
```

### Callback Functions

#### `onImageLoad(config)`
Called before loading comic page images.

```javascript
function onImageLoad(config) {
  // Add authentication headers
  config.headers = {
    ...config.headers,
    'Authorization': 'Bearer ' + this.authToken
  };
  
  return config;
}
```

#### `onThumbnailLoad(config)`
Called before loading comic thumbnails.

```javascript
function onThumbnailLoad(config) {
  // Configure thumbnail size and quality
  config.params = {
    ...config.params,
    width: 200,
    height: 300,
    quality: 80
  };
  
  return config;
}
```

## Usage Examples

### Basic API Call
```javascript
async function getPopularComics(page = 1) {
  const response = await Network.sendRequest(
    'GET',
    'https://api.manga.com/popular',
    {},
    null,
    { page: page, limit: 20 }
  );
  
  const data = JSON.parse(Convert.decodeUtf8(response.body));
  return data.results;
}
```

### HTML Parsing
```javascript
async function parseComicList(html) {
  const doc = new HtmlDocument(html);
  const comicElements = doc.selectAll('.comic-item');
  
  const comics = [];
  for (const element of comicElements) {
    const title = element.select('.title').text();
    const coverUrl = element.select('img').attr('src');
    
    comics.push({
      title: title,
      cover: coverUrl
    });
  }
  
  return comics;
}
```

### Image Processing
```javascript
async function processImage(imageBytes) {
  const image = Image.fromBytes(imageBytes);
  const resized = image.resize(300, 400);
  return resized.toBytes();
}
```

These APIs form the foundation of Venera source configurations. Always refer to the actual `init.js` file for the most up-to-date API definitions.