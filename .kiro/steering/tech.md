# Technology Stack

## Architecture

Configuration-as-code pattern: Each source is a standalone JavaScript class that extends `ComicSource` and implements data fetching/parsing logic for specific websites.

## Core Technologies

- **Language**: JavaScript ES6+ (classes, async/await)
- **Runtime**: Venera app runtime (uses embedded `Network` API)
- **Type Definitions**: TypeScript via `/** @type {import('./_venera_.js')} */` JSDoc comments

## Key Libraries

- **Network API**: Provided by Venera runtime for HTTP requests (`Network.get`, `Network.post`, `Network.delete`)
- **Data Models**: `Comic`, `ComicDetails`, `Comment`, `PageJumpTarget` (defined in `_venera_.js`)
- **Storage**: `this.saveData()`, `this.loadData()` for local persistence
- **Cookies**: `Network.setCookies()`, `Network.deleteCookies()` for session management

## Development Standards

### Type Safety
- JSDoc comments for function signatures and return types
- Import type definitions from `_venera_.js` for IDE autocomplete

### Code Quality
- Async/await for all network operations
- Error handling with `throw` for user-facing messages
- Use `return` values for success, `throw` for failures

### Testing
- Manual testing through Venera app integration
- No automated test framework

## Development Environment

### Required Tools
- Text editor with JSDoc support (VS Code recommended)
- Venera app runtime for testing configurations

### Common Commands
```bash
# No build step - direct file editing
# Copy template to start new source:
cp _template_.js your_source.js
```

## Key Technical Decisions

**Configuration over Code**: Each source is a self-contained JavaScript class that handles parsing and API interactions. This makes sources easy to test and maintain independently.

**Extensibility via Options**: `optionList` and `optionLoader` patterns allow sources to expose user-configurable filters, sorts, and other parameters without code changes.

**Image Loading Config**: `onImageLoad` and `onThumbnailLoad` hooks allow custom headers, referers, and modifications per-source.

---
_Document standards and patterns, not every dependency_
