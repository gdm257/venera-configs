# Project Structure

## Organization Philosophy

Flat configuration pattern: All source configurations are standalone `.js` files in the root directory. Each file represents one manga/comic source and extends the `ComicSource` class.

## Directory Patterns

### Root Configuration Files (`/`)
**Location**: Project root  
**Purpose**: Individual source implementations  
**Example**: `copy_manga.js`, `nhentai.js`, `komiic.js`

### Template and Types
**Location**: Root level  
**Purpose**: Development scaffolding  
**Files**:
- `_template_.js`: Boilerplate class with all optional methods
- `_venera_.js`: TypeScript type definitions for IDE autocomplete

### Source Registry
**Location**: `index.json`  
**Purpose**: Metadata for all available sources  
**Schema**: Array of objects with `name`, `fileName`, `key`, `version`, `description`

## Naming Conventions

- **Config files**: `kebab_case.js` (e.g., `copy_manga.js`, `shonen_jump_plus.js`)
- **Class name**: `NewComicSource` (from template, should be renamed appropriately)
- **Source key**: `camelCase` or PascalCase (e.g., `copy_manga`, `Komiic`)
- **IDs**: String identifiers, often numeric or slugs from source website

## Import Organization

```javascript
// Type import at top of file
/** @type {import('./_venera_.js')} */

// No other imports - use global APIs (Network, Comic, etc.)
```

**Path Aliases**: None - all imports are relative to project root

## Code Organization Principles

### Class Extension Pattern
All sources extend `ComicSource` base class. Methods are optional - implement only what the source supports.

### Method Categories
- **Required**: `name`, `key`, `version`, `minAppVersion`, `url`
- **Core**: `explore`, `category`, `search`, `comic.loadInfo`, `comic.loadEp`
- **Optional**: `account`, `favorites`, settings, `comic.loadComments`, etc.

### Data Flow
1. User action triggers method (e.g., `search.load()`)
2. Config uses `Network` API to fetch data
3. Response parsed and returned as standard models (`Comic`, `ComicDetails`)
4. Venera app renders data

### Helper Functions
Define local `parseComic()` functions to standardize data transformation:
```javascript
function parseComic(comic) {
    return new Comic({
        id: comic.id,
        title: comic.title,
        cover: comic.cover_url,
        tags: comic.tags,
        description: comic.desc,
    })
}
```

---
_Document patterns, not file trees. New files following patterns shouldn't require updates_
