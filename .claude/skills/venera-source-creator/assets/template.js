/**
 * Venera Source Template
 * Based on actual Venera JavaScript API from init.js
 */

/** @type {import('./_venera_.js')} */

class {{CLASS_NAME}} extends ComicSource {
    // ====================
    // Required Properties
    // ====================
    
    name = '{{SOURCE_NAME}}';
    key = '{{SOURCE_KEY}}';
    version = '{{VERSION}}';
    minAppVersion = '{{MIN_APP_VERSION}}';
    url = '{{URL}}';
    
    // ====================
    // Optional Properties
    // ====================
    
    description = '{{DESCRIPTION}}';
    icon = ''; // URL to source icon (optional)
    lang = '{{LANGUAGE}}'; // Language code: 'en', 'ja', 'zh', etc.
    timezone = '{{TIMEZONE}}'; // Default timezone
    
    // Comics per page for pagination
    comicsPerPage = 20;
    
    // ====================
    // Core API Methods
    // ====================
    
    /**
     * Get popular comics (homepage)
     * @param {number} page - Page number (1-indexed)
     * @returns {Promise<Comic[]>}
     */
    async getPopular(page) {
        try {
            // TODO: Implement popular comics API call
            // Example: fetch popular comics from source API
            const response = await Network.sendRequest(
                'GET',
                `${this.apiBaseUrl}/popular`,
                {},
                null,
                { page: page, limit: this.comicsPerPage }
            );
            
            const data = JSON.parse(Convert.decodeUtf8(response));
            return data.results.map(item => this.parseComic(item));
        } catch (error) {
            console.error('getPopular error:', error);
            throw new Error(`Failed to load popular comics: ${error.message}`);
        }
    }
    
    /**
     * Get latest comics
     * @param {number} page - Page number (1-indexed)
     * @returns {Promise<Comic[]>}
     */
    async getLatest(page) {
        try {
            // TODO: Implement latest comics API call
            const response = await Network.sendRequest(
                'GET',
                `${this.apiBaseUrl}/latest`,
                {},
                null,
                { page: page, limit: this.comicsPerPage }
            );
            
            const data = JSON.parse(Convert.decodeUtf8(response));
            return data.results.map(item => this.parseComic(item));
        } catch (error) {
            console.error('getLatest error:', error);
            throw new Error(`Failed to load latest comics: ${error.message}`);
        }
    }
    
    /**
     * Search comics by keyword
     * @param {string} keyword - Search query
     * @param {number} page - Page number (1-indexed)
     * @returns {Promise<Comic[]>}
     */
    async search(keyword, page) {
        try {
            // TODO: Implement search API call
            const response = await Network.sendRequest(
                'GET',
                `${this.apiBaseUrl}/search`,
                {},
                null,
                { q: keyword, page: page, limit: this.comicsPerPage }
            );
            
            const data = JSON.parse(Convert.decodeUtf8(response));
            return data.results.map(item => this.parseComic(item));
        } catch (error) {
            console.error('search error:', error);
            throw new Error(`Search failed: ${error.message}`);
        }
    }
    
    /**
     * Load comic details
     * @param {string} id - Comic identifier
     * @returns {Promise<ComicDetails>}
     */
    async loadInfo(id) {
        try {
            // TODO: Load comic info, chapters, and stats in parallel
            const [comicData, chapters, stats] = await Promise.all([
                this.fetchComicInfo(id),
                this.fetchChapters(id),
                this.fetchStats(id) // Optional
            ]);
            
            return ComicDetails({
                id: comicData.id,
                title: comicData.title,
                subtitle: comicData.subtitle || comicData.author,
                cover: comicData.cover,
                tags: this.organizeTags(comicData.tags, comicData.authors, comicData.status),
                description: comicData.description || '',
                chapters: chapters,
                updateTime: comicData.updateTime,
                uploadTime: comicData.createTime || comicData.updateTime,
                stars: comicData.rating || (stats?.rating || 0) / 2,
                url: comicData.url || `${this.baseUrl}/title/${id}`,
                // Optional fields
                commentCount: stats?.comments || 0,
                likesCount: stats?.follows || stats?.likes || 0,
                uploader: comicData.uploader,
                status: comicData.status,
                maxPage: comicData.maxPage
            });
        } catch (error) {
            console.error('loadInfo error:', error);
            throw new Error(`Failed to load comic details: ${error.message}`);
        }
    }
    
    /**
     * Load chapter images
     * @param {string} comicId - Comic identifier (unused in some sources)
     * @param {string} chapterId - Chapter identifier
     * @returns {Promise<{images: string[]}>}
     */
    async loadEp(comicId, chapterId) {
        try {
            if (!chapterId) {
                throw new Error('No chapter id provided');
            }
            
            // TODO: Implement chapter images API call
            const response = await Network.sendRequest(
                'GET',
                `${this.apiBaseUrl}/chapter/${chapterId}/images`,
                {},
                null,
                {}
            );
            
            const data = JSON.parse(Convert.decodeUtf8(response));
            
            // Return array of image URLs
            return {
                images: data.pages || data.images || []
            };
        } catch (error) {
            console.error('loadEp error:', error);
            throw new Error(`Failed to load chapter images: ${error.message}`);
        }
    }
    
    // ====================
    // Helper Methods
    // ====================
    
    /**
     * Parse raw comic data into Comic object
     * @param {object} raw - Raw comic data from API
     * @returns {Comic}
     */
    parseComic(raw) {
        // TODO: Adapt this to your API response structure
        return Comic({
            id: String(raw.id || raw.slug),
            title: raw.title || raw.name,
            subtitle: raw.author || raw.authors?.[0] || '',
            cover: raw.cover || raw.thumbnail || raw.image_url,
            tags: Array.isArray(raw.tags) ? raw.tags : raw.genres?.map(g => g.name) || [],
            description: raw.description || raw.summary || '',
            maxPage: raw.total_chapters || 0,
            language: raw.language || 'en',
            favoriteId: raw.favorite_id || '',
            stars: raw.rating || 0
        });
    }
    
    /**
     * Fetch comic information from API
     * @param {string} id - Comic identifier
     * @returns {Promise<object>}
     */
    async fetchComicInfo(id) {
        // TODO: Implement comic info API call
        const response = await Network.sendRequest(
            'GET',
            `${this.apiBaseUrl}/comic/${id}`,
            {},
            null,
            {}
        );
        
        const data = JSON.parse(Convert.decodeUtf8(response));
        return data;
    }
    
    /**
     * Fetch chapters for a comic
     * @param {string} id - Comic identifier
     * @returns {Promise<Map>} - Chapter map structure
     */
    async fetchChapters(id) {
        // TODO: Implement chapters API call
        const response = await Network.sendRequest(
            'GET',
            `${this.apiBaseUrl}/comic/${id}/chapters`,
            {},
            null,
            { limit: 500, order: 'asc' }
        );
        
        const data = JSON.parse(Convert.decodeUtf8(response));
        const chapters = new Map();
        
        // Process chapters into the required Map structure
        for (const chapter of data.results || data.chapters || []) {
            const chapterId = chapter.id;
            const chapterNum = chapter.chapter || chapter.number;
            const title = chapter.title;
            const displayTitle = title ? `${chapterNum}: ${title}` : `Chapter ${chapterNum}`;
            
            // Group by volume
            const volume = chapter.volume;
            const volumeName = volume ? `Volume ${volume}` : "No Volume";
            
            if (!chapters.get(volumeName)) {
                chapters.set(volumeName, new Map());
            }
            
            chapters.get(volumeName).set(chapterId, displayTitle);
        }
        
        return chapters;
    }
    
    /**
     * Fetch statistics for a comic (optional)
     * @param {string} id - Comic identifier
     * @returns {Promise<object>}
     */
    async fetchStats(id) {
        try {
            // TODO: Implement stats API call (optional)
            const response = await Network.sendRequest(
                'GET',
                `${this.apiBaseUrl}/comic/${id}/stats`,
                {},
                null,
                {}
            );
            
            const data = JSON.parse(Convert.decodeUtf8(response));
            return {
                comments: data.comments || 0,
                follows: data.follows || data.likes || 0,
                rating: data.rating || 0
            };
        } catch (error) {
            // Stats are optional, return defaults if unavailable
            return { comments: 0, follows: 0, rating: 0 };
        }
    }
    
    /**
     * Organize tags into categorized structure
     * @param {string[]} tags - Array of tag strings
     * @param {string[]} authors - Array of author names
     * @param {string} status - Publication status
     * @returns {object} - Organized tags
     */
    organizeTags(tags, authors, status) {
        const organized = {};
        
        if (Array.isArray(tags) && tags.length > 0) {
            organized["Genres"] = tags;
        }
        
        if (Array.isArray(authors) && authors.length > 0) {
            organized["Authors"] = authors;
        }
        
        if (status) {
            organized["Status"] = [this.mapStatus(status)];
        }
        
        return organized;
    }
    
    /**
     * Map status to standardized format
     * @param {string} rawStatus - Raw status from API
     * @returns {string} - Mapped status
     */
    mapStatus(rawStatus) {
        const statusMap = {
            'ongoing': 'Ongoing',
            'completed': 'Completed',
            'hiatus': 'Hiatus',
            'cancelled': 'Cancelled',
            'finished': 'Completed',
            'publishing': 'Ongoing',
            'discontinued': 'Cancelled'
        };
        
        const normalized = (rawStatus || '').toLowerCase();
        return statusMap[normalized] || rawStatus || 'Unknown';
    }
    
    // ====================
    // Optional Features
    // ====================
    
    /**
     * Image loading configuration
     * Uncomment and implement if needed
     */
    /*
    onImageLoad(config) {
        // Add authentication headers or modify image requests
        config.headers = config.headers || {};
        config.headers['Referer'] = this.baseUrl;
        config.headers['User-Agent'] = 'Mozilla/5.0 (compatible; Venera/1.0)';
        return config;
    }
    
    onThumbnailLoad(config) {
        // Configure thumbnail loading
        return config;
    }
    */
    
    /**
     * User authentication (optional)
     * Uncomment and implement if source supports accounts
     */
    /*
    async login(username, password) {
        try {
            const response = await Network.sendRequest(
                'POST',
                `${this.apiBaseUrl}/auth/login`,
                { 'Content-Type': 'application/json' },
                JSON.stringify({ username, password }),
                {}
            );
            
            const data = JSON.parse(Convert.decodeUtf8(response));
            
            if (data.token) {
                this.saveData('auth_token', data.token);
                return { success: true, user: data.user };
            }
            
            return { success: false, message: data.message || 'Login failed' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
    
    async checkLogin() {
        const token = this.loadData('auth_token');
        if (!token) {
            return { loggedIn: false };
        }
        
        try {
            const response = await Network.sendRequest(
                'GET',
                `${this.apiBaseUrl}/auth/me`,
                { 'Authorization': `Bearer ${token}` },
                null,
                {}
            );
            
            const data = JSON.parse(Convert.decodeUtf8(response));
            return { loggedIn: true, user: data };
        } catch (error) {
            return { loggedIn: false };
        }
    }
    */
    
    /**
     * Favorites management (optional)
     * Uncomment and implement if source supports favorites
     */
    /*
    async getFavorites(page) {
        const token = this.loadData('auth_token');
        if (!token) {
            throw new Error('Not authenticated');
        }
        
        const response = await Network.sendRequest(
            'GET',
            `${this.apiBaseUrl}/favorites`,
            { 'Authorization': `Bearer ${token}` },
            null,
            { page: page, limit: this.comicsPerPage }
        );
        
        const data = JSON.parse(Convert.decodeUtf8(response));
        return data.results.map(item => this.parseComic(item));
    }
    */
    
    // ====================
    // Configuration
    // ====================
    
    // Base URL for the source website
    baseUrl = '{{BASE_URL}}';
    
    // API base URL (if different from baseUrl)
    apiBaseUrl = '{{API_BASE_URL}}' || this.baseUrl;
    
    // Custom headers for all requests (optional)
    defaultHeaders = {
        'User-Agent': 'Mozilla/5.0 (compatible; Venera/1.0)',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': this.baseUrl
    };
    
    // Initialize with default headers
    constructor() {
        super();
        // Apply default headers to Network
        Network.defaultHeaders = this.defaultHeaders;
    }
}

// Note: Venera automatically detects and registers ComicSource subclasses
// The class name should match the filename (e.g., MangaDex for manga_dex.js)