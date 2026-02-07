# Venera Source API Reference

Complete API reference for Venera comic source development.

## Global Classes

### ComicSource (Base Class)

```javascript
class MySource extends ComicSource {
    // Required properties
    name = "Source Name"
    key = "unique_key"
    version = "1.0.0"
    minAppVersion = "1.0.0"
    url = "https://example.com/source.js"

    // Optional properties
    requireLogin = false
    useExplorePage = false
    explorePage = []
}
```

### Comic (Data Model)

```javascript
new Comic({
    id: "required_id",           // Required
    title: "Required Title",     // Required
    cover: "https://...",        // Optional
    subtitle: "Author Name",     // Optional
    tags: ["tag1", "tag2"],      // Optional
    description: "Brief desc",   // Optional
    maxPage: 100,                // Optional
    language: "zh",              // Optional
    favoriteId: "fav_123",       // Optional
    stars: 5                     // Optional (1-5)
})
```

### ComicDetails (Data Model)

```javascript
new ComicDetails({
    title: "Required",           // Required
    subtitle: "",                // Optional
    cover: "",                   // Optional
    description: "",           // Optional
    tags: {                      // Optional
        "分类": ["冒险"],
        "作者": ["作者名"]
    },
    chapters: [                  // Required if has chapters
        {
            title: "Chapter 1",
            id: "ch_1",
            time: "2024-01-01",
            page: 24
        }
    ],
    isFavorite: false,           // Optional
    subId: "",                   // Optional
    thumbnails: [],              // Optional
    recommend: [],             // Optional
    commentCount: 0,             // Optional
    likesCount: 0,               // Optional
    isLiked: false,              // Optional
    comments: [],              // Optional
    uploader: "",                // Optional
    updateTime: "",              // Optional
    uploadTime: "",              // Optional
    url: "",                     // Optional
    stars: 5,                    // Optional
    maxPage: 1                   // Optional
})
```

### Comment (Data Model)

```javascript
new Comment({
    userName: "User Name",
    avatar: "https://...",       // Avatar URL
    content: "Comment text",
    time: "2024-01-01 12:00",
    replyCount: 5,
    id: "comment_123",
    isLiked: false,
    score: 5,
    voteStatus: "up"             // "up", "down", or null
})
```

### HtmlDocument (Parser)

```javascript
// Create from HTML string
const doc = new HtmlDocument(htmlString)

// Query methods
const element = doc.querySelector(".class-name")      // First match
const elements = doc.querySelectorAll(".item")         // All matches

// Element properties
element.tagName          // "DIV", "A", "IMG" (uppercase)
element.text             // Text content
element.innerHTML        // Inner HTML
element.attributes       // Object of attributes
element.getAttribute(name)  // Get specific attribute

// Common patterns
// Get link URL
const href = element.getAttribute('href')

// Get image src
const src = element.getAttribute('src')

// Get data attribute
const dataId = element.getAttribute('data-id')

// Get class list (as string)
const className = element.getAttribute('class')
```

### FormData (Multipart Builder)

```javascript
const form = new FormData()

// Add text field
form.append("key", "value")
form.append("username", "john")

// Add file (for file uploads)
form.appendFile("file", "filename.jpg", uint8ArrayData)
form.appendFile("avatar", "avatar.png", imageData)

// Use in request
const res = await Network.post(
    "https://api.example.com/upload",
    {},
    form
)
```

### Url (URL Parser)

```javascript
const url = new Url("https://example.com/path?key=value#anchor")

url.path       // "/path"
url.query      // { key: "value" }
url.fragment   // "anchor"
```

## Network API

### Request Methods

```javascript
// Generic request (returns text)
await Network.sendRequest(method, url, headers, data, extra)

// HTTP method shortcuts
await Network.get(url, headers, extra)
await Network.post(url, headers, data, extra)
await Network.put(url, headers, data, extra)
await Network.patch(url, headers, data, extra)
await Network.delete(url, headers, data, extra)

// Binary data request
await Network.fetchBytes(method, url, headers, data, extra)
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `method` | string | HTTP method: "GET", "POST", "PUT", "DELETE", "PATCH" |
| `url` | string | Request URL |
| `headers` | object | Request headers: `{"Content-Type": "application/json"}` |
| `data` | string | Request body (for POST/PUT/PATCH) |
| `extra` | object | Additional options |

### Extra Options

```javascript
{
    withCredentials: true,       // Include cookies
    responseType: "arraybuffer"    // Response type
}
```

### Response Object

```javascript
{
    statusCode: 200,        // HTTP status code
    headers: {},          // Response headers (object)
    body: "..."             // Response body (string or Uint8Array)
}
```

### Common Request Patterns

```javascript
// Simple GET
const res = await Network.get("https://api.example.com/data")

// GET with headers
const res = await Network.get(
    "https://api.example.com/data",
    {
        "Authorization": "Bearer token",
        "Accept": "application/json"
    }
)

// POST with JSON body
const res = await Network.post(
    "https://api.example.com/login",
    {"Content-Type": "application/json"},
    JSON.stringify({username: "user", password: "pass"})
)

// POST with FormData
const form = new FormData()
form.append("file", "data")
const res = await Network.post(
    "https://api.example.com/upload",
    {},
    form
)

// Binary data download
const res = await Network.fetchBytes(
    "GET",
    "https://example.com/image.jpg",
    {},
    null,
    {responseType: "arraybuffer"}
)
// res.body is Uint8Array
```

## Convert API (Encoding & Crypto)

### Text Encoding

```javascript
// String to bytes (UTF-8)
const bytes = Convert.encodeUtf8("Hello World")
// Returns: Uint8Array

// Bytes to string (UTF-8)
const str = Convert.decodeUtf8(bytes)
// Returns: string
```

### Base64

```javascript
// Bytes to Base64
const base64 = Convert.encodeBase64(bytes)
// Returns: base64 string

// Base64 to bytes
const bytes = Convert.decodeBase64(base64String)
// Returns: Uint8Array
```

### Hash Functions

```javascript
// All return Uint8Array
const md5Hash = Convert.md5(data)
const sha1Hash = Convert.sha1(data)
const sha256Hash = Convert.sha256(data)
const sha512Hash = Convert.sha512(data)

// Hash string example
const str = "password"
const bytes = Convert.encodeUtf8(str)
const hash = Convert.md5(bytes)
const hashHex = Array.from(hash)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
```

### AES Encryption

```javascript
// ECB Mode (Electronic Codebook)
// WARNING: ECB is not recommended for production use

// Encrypt
const plaintext = Convert.encodeUtf8("secret message")
const encrypted = Convert.encryptAesEcb(plaintext, "mysecretkey12345")
const encryptedBase64 = Convert.encodeBase64(encrypted)

// Decrypt
const encryptedBytes = Convert.decodeBase64(encryptedBase64)
const decrypted = Convert.decryptAesEcb(encryptedBytes, "mysecretkey12345")
const decryptedText = Convert.decodeUtf8(decrypted)

// CBC Mode (Cipher Block Chaining)
// More secure than ECB, requires IV (Initialization Vector)

// Encrypt
const iv = "1234567890123456"  // Must be 16 bytes for AES
const encrypted = Convert.encryptAesCbc(plaintext, key, iv)

// Decrypt
const decrypted = Convert.decryptAesCbc(encrypted, key, iv)
```

### Common Crypto Patterns

```javascript
// Sign API request
function signRequest(params, secretKey) {
    // Sort params alphabetically
    const sorted = Object.keys(params).sort()
    const paramStr = sorted.map(k => `${k}=${params[k]}`).join('&')

    // Create signature
    const signStr = paramStr + secretKey
    const bytes = Convert.encodeUtf8(signStr)
    const hash = Convert.md5(bytes)

    // Convert to hex
    return Array.from(hash)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
}

// Encode query parameter
function encodeParam(obj, key) {
    const jsonStr = JSON.stringify(obj)
    const bytes = Convert.encodeUtf8(jsonStr)
    const encrypted = Convert.encryptAesEcb(bytes, key)
    return Convert.encodeBase64(encrypted)
}

// Generate device fingerprint
function generateFingerprint() {
    const data = `${APP.platform}-${APP.version}-${Date.now()}`
    const bytes = Convert.encodeUtf8(data)
    const hash = Convert.sha256(bytes)
    return Convert.encodeBase64(hash).substring(0, 16)
}
```

## UI API

### Message Toast

```javascript
UI.showMessage("Operation successful")
UI.showMessage("Loading...")  // Auto dismisses
```

### Dialogs

```javascript
// Alert
UI.showDialog("Title", "Message content", [
    {
        text: "OK",
        callback: () => console.log("Confirmed")
    }
])

// Confirm
UI.showDialog("Confirm", "Are you sure?", [
    { text: "Cancel", callback: () => {} },
    {
        text: "Confirm",
        callback: () => {
            console.log("Action confirmed")
        }
    }
])

// Multiple options
UI.showDialog("Choose Action", "What would you like to do?", [
    { text: "View", callback: () => viewItem() },
    { text: "Download", callback: () => downloadItem() },
    { text: "Share", callback: () => shareItem() },
    { text: "Cancel", callback: () => {} }
])
```

### Loading

```javascript
UI.showLoading("Loading data...")

// Do async work
try {
    const result = await fetchData()
    UI.showMessage("Loaded successfully")
} catch (e) {
    UI.showMessage(`Error: ${e.message}`)
} finally {
    UI.hideLoading()
}
```

### Input Dialog

```javascript
// Simple text input
const result = await UI.showInputDialog("Enter your name", (value) => {
    if (!value || value.trim().length === 0) {
        return "Name cannot be empty"
    }
    if (value.length < 2) {
        return "Name must be at least 2 characters"
    }
    return null  // Validation passed
})

if (result !== null) {
    console.log("User entered:", result)
}

// Password input (with validation)
const password = await UI.showInputDialog("Enter password", (value) => {
    if (!value || value.length < 8) {
        return "Password must be at least 8 characters"
    }
    if (!/[A-Z]/.test(value)) {
        return "Password must contain at least one uppercase letter"
    }
    if (!/[0-9]/.test(value)) {
        return "Password must contain at least one number"
    }
    return null
})
```

### Select Dialog

```javascript
// Single selection
const genres = ["Action", "Adventure", "Comedy", "Drama", "Fantasy"]
const selectedIndex = await UI.showSelectDialog(
    "Select genre",
    genres,
    0  // Default selection index
)

if (selectedIndex !== null) {
    console.log("Selected:", genres[selectedIndex])
}

// With current value
const currentGenre = "Comedy"
const defaultIndex = genres.indexOf(currentGenre)
const newIndex = await UI.showSelectDialog(
    "Change genre",
    genres,
    defaultIndex
)
```

## APP API

```javascript
// App version
const version = APP.version
// Example: "1.0.5"

// User locale
const locale = APP.locale
// Examples: "zh_CN", "en", "ja", "ko"

// Platform
const platform = APP.platform
// Values: "android", "ios", "windows", "macos", "linux"

// Usage examples
if (APP.locale === "zh_CN") {
    // Show Chinese-specific content
}

if (APP.platform === "ios" || APP.platform === "android") {
    // Mobile-specific behavior
}
```

## Date Utility

```javascript
// Format timestamp to string
__date(timestamp, format)

// Format placeholders:
// "y" or "Y" - Year (4 digits): 2024
// "M" - Month (01-12): 01
// "d" or "D" - Day (01-31): 15
// "h" or "H" - Hour (00-23): 14
// "m" - Minute (00-59): 30
// "s" or "S" - Second (00-59): 45

// Examples:
__date(1704067200000, "y-M-d")
// "2024-01-01"

__date(Date.now(), "y/M/d h:m:s")
// "2024/01/15 08:30:25"

__date(timestamp, "y年M月d日")
// "2024年01月15日"

__date(Date.now(), "M/d/y h:m")
// "01/15/2024 08:30"
```
