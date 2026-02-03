/**
 * Venera Source Template
 * Generated: {{CREATED_AT}}
 * Author: {{AUTHOR}}
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
    
    // ====================
    // Core Methods
    // ====================
    
    /**
     * Explore/Browse comics
     * @param {number} page - Page number (1-indexed)
     * @returns {Promise<Comic[]>}
     */
    async explore(page = 1) {
        try {
            // TODO: Implement explore logic
            // Example: return popular comics for homepage
            const response = await Network.get(`${this.url}/api/popular`, {
                params: { page, limit: 24 }
            });
            
            if (!response.ok) {
                throw new Error(`Explore failed: ${response.status}`);
            }
            
            return response.data.results.map(item => this._parseComic(item));
        } catch (error) {
            throw new Error(`Explore error: ${error.message}`);
        }
    }
    
    /**
     * Browse comics by category
     * @param {string} categoryId - Category identifier
     * @param {number} page - Page number
     * @returns {Promise<Comic[]>}
     */
    async category(categoryId, page = 1) {
        try {
            // TODO: Implement category browsing
            // Example: category-specific API endpoint
            const response = await Network.get(`${this.url}/api/category/${categoryId}`, {
                params: { page, limit: 20 }
            });
            
            return response.data.results.map(item => this._parseComic(item));
        } catch (error) {
            throw new Error(`Category browse error: ${error.message}`);
        }
    }
    
    /**
     * Search comics by keyword
     * @param {string} keyword - Search query
     * @param {number} page - Page number
     * @returns {Promise<Comic[]>}
     */
    async search(keyword, page = 1) {
        try {
            const response = await Network.get(`${this.url}/api/search`, {
                params: {
                    q: keyword,
                    page: page,
                    limit: 20
                }
            });
            
            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }
            
            return response.data.results.map(item => this._parseComic(item));
        } catch (error) {
            throw new Error(`Search error: ${error.message}`);
        }
    }
    
    /**
     * Load comic details
     * @param {string} comicId - Comic identifier
     * @returns {Promise<ComicDetails>}
     */
    async comic.loadInfo(comicId) {
        try {
            // Load comic info and episodes in parallel for better performance
            const [infoResponse, episodesResponse] = await Promise.all([
                Network.get(`${this.url}/api/comics/${comicId}`),
                Network.get(`${this.url}/api/comics/${comicId}/episodes`, {
                    params: { page: 1, limit: 50 }
                })
            ]);
            
            const info = infoResponse.data;
            const episodes = episodesResponse.data.results || [];
            
            // Load related comics if available
            let related = [];
            if (info.related_ids && info.related_ids.length > 0) {
                try {
                    const relatedResponse = await Network.get(`${this.url}/api/comics/batch`, {
                        params: { ids: info.related_ids.join(',') }
                    });
                    related = (relatedResponse.data.results || []).map(item => this._parseComic(item));
                } catch (error) {
                    // Silently fail for related comics - not critical
                    console.warn('Failed to load related comics:', error.message);
                }
            }
            
            return new ComicDetails({
                id: String(info.id),
                title: info.title,
                cover: info.cover_image || info.thumbnail,
                tags: info.genres?.map(g => g.name) || info.tags || [],
                description: info.description || info.summary || '',
                author: info.author || info.authors?.map(a => a.name).join(', ') || '',
                status: this._mapStatus(info.status),
                updateTime: info.updated_at ? new Date(info.updated_at).getTime() : Date.now(),
                episodes: episodes.map(item => this._parseEpisode(item)),
                related: related,
                alternativeTitles: info.alternative_titles || [],
                publisher: info.publisher?.name || '',
                year: info.publication_year,
                volumes: info.total_volumes,
                chapters: info.total_chapters,
                contentRating: this._mapContentRating(info.is_adult),
                downloadable: info.download_enabled || false
            });
        } catch (error) {
            throw new Error(`Failed to load comic details: ${error.message}`);
        }
    }
    
    /**
     * Load episode details
     * @param {string} episodeId - Episode identifier
     * @returns {Promise<Episode>}
     */
    async comic.loadEp(episodeId) {
        try {
            const response = await Network.get(`${this.url}/api/episodes/${episodeId}`);
            const episodeData = response.data;
            
            return this._parseEpisode(episodeData);
        } catch (error) {
            throw new Error(`Failed to load episode: ${error.message}`);
        }
    }
    
    // ====================
    // Optional User Features
    // ====================
    
    /**
     * User account management
     * Uncomment and implement if source supports user accounts
     */
    /*
    account = {
        async login(credentials) {
            try {
                const response = await Network.post(`${this.url}/auth/login`, credentials);
                
                // Save authentication data
                if (response.data.token) {
                    this.saveData('auth_token', response.data.token);
                    Network.setHeaders({
                        'Authorization': `Bearer ${response.data.token}`
                    });
                }
                
                return { success: true, user: response.data.user };
            } catch (error) {
                throw new Error(`Login failed: ${error.message}`);
            }
        },
        
        async logout() {
            try {
                await Network.post(`${this.url}/auth/logout`);
                this.deleteData('auth_token');
                return { success: true };
            } catch (error) {
                throw new Error(`Logout failed: ${error.message}`);
            }
        },
        
        async checkLogin() {
            try {
                const token = this.loadData('auth_token');
                if (!token) {
                    return { loggedIn: false };
                }
                
                const response = await Network.get(`${this.url}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                return { loggedIn: true, user: response.data };
            } catch (error) {
                return { loggedIn: false };
            }
        }
    };
    */
    
    /**
     * User favorites management
     * Uncomment and implement if source supports favorites
     */
    /*
    favorites = {
        async list(page = 1) {
            try {
                const token = this.loadData('auth_token');
                if (!token) {
                    throw new Error('Not authenticated');
                }
                
                const response = await Network.get(`${this.url}/api/favorites`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    params: { page, limit: 20 }
                });
                
                return response.data.results.map(item => this._parseComic(item));
            } catch (error) {
                throw new Error(`Failed to load favorites: ${error.message}`);
            }
        },
        
        async add(comicId) {
            try {
                const token = this.loadData('auth_token');
                if (!token) {
                    throw new Error('Not authenticated');
                }
                
                await Network.post(`${this.url}/api/favorites/${comicId}`, {}, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                return { success: true };
            } catch (error) {
                throw new Error(`Failed to add favorite: ${error.message}`);
            }
        },
        
        async remove(comicId) {
            try {
                const token = this.loadData('auth_token');
                if (!token) {
                    throw new Error('Not authenticated');
                }
                
                await Network.delete(`${this.url}/api/favorites/${comicId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                return { success: true };
            } catch (error) {
                throw new Error(`Failed to remove favorite: ${error.message}`);
            }
        }
    };
    */
    
    // ====================
    // Optional Social Features
    // ====================
    
    /**
     * Load comments for a comic
     * Uncomment and implement if source supports comments
     */
    /*
    async comic.loadComments(comicId, page = 1) {
        try {
            const response = await Network.get(`${this.url}/api/comics/${comicId}/comments`, {
                params: { page, limit: 20 }
            });
            
            return response.data.results.map(item => new Comment({
                id: String(item.id),
                userId: String(item.user_id),
                username: item.username,
                avatar: item.avatar_url,
                content: item.content,
                time: new Date(item.created_at).getTime(),
                likes: item.likes || 0,
                replies: item.replies?.map(reply => new Comment({
                    id: String(reply.id),
                    userId: String(reply.user_id),
                    username: reply.username,
                    avatar: reply.avatar_url,
                    content: reply.content,
                    time: new Date(reply.created_at).getTime(),
                    likes: reply.likes || 0
                })) || []
            }));
        } catch (error) {
            throw new Error(`Failed to load comments: ${error.message}`);
        }
    }
    */
    
    /**
     * Load comment replies
     * Uncomment and implement if source supports threaded comments
     */
    /*
    async comment.loadReply(commentId, page = 1) {
        try {
            const response = await Network.get(`${this.url}/api/comments/${commentId}/replies`, {
                params: { page, limit: 20 }
            });
            
            return response.data.results.map(item => new Comment({
                id: String(item.id),
                userId: String(item.user_id),
                username: item.username,
                avatar: item.avatar_url,
                content: item.content,
                time: new Date(item.created_at).getTime(),
                likes: item.likes || 0
            }));
        } catch (error) {
            throw new Error(`Failed to load replies: ${error.message}`);
        }
    }
    */
    
    // ====================
    // Optional Configuration
    // ====================
    
    /**
     * Define user-configurable options
     * Uncomment and implement if source has configurable options
     */
    /*
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
    */
    
    /**
     * Configure image loading behavior
     * Uncomment and implement if source requires custom image headers
     */
    /*
    onImageLoad(config) {
        // Add referer header for image requests (required by some sites)
        config.headers = config.headers || {};
        config.headers['Referer'] = this.url;
        return config;
    }
    
    onThumbnailLoad(config) {
        // Configure thumbnail loading (resize, quality, etc.)
        config.params = config.params || {};
        config.params.width = 200;
        config.params.height = 300;
        config.params.quality = 80;
        return config;
    }
    */
    
    // ====================
    // Helper Methods
    // ====================
    
    /**
     * Parse raw comic data into Comic object
     * @param {object} raw - Raw comic data from API
     * @returns {Comic}
     * @private
     */
    _parseComic(raw) {
        return new Comic({
            id: String(raw.id || raw.slug),
            title: raw.title || raw.name,
            cover: raw.cover_url || raw.thumbnail || raw.image_url,
            tags: Array.isArray(raw.tags) ? raw.tags : raw.genres?.map(g => g.name) || [],
            description: raw.description || raw.summary || '',
            author: raw.author || raw.authors?.map(a => a.name).join(', ') || '',
            status: this._mapStatus(raw.status),
            updateTime: raw.updated_at ? new Date(raw.updated_at).getTime() : Date.now(),
            popularity: raw.popularity_score || raw.views || 0,
            rating: parseFloat(raw.rating) || 0,
            episodeCount: raw.total_chapters || raw.chapter_count || 0,
            lastEpisode: raw.latest_chapter || '',
            adult: raw.is_adult || false
        });
    }
    
    /**
     * Parse raw episode data into Episode object
     * @param {object} raw - Raw episode data from API
     * @returns {Episode}
     * @private
     */
    _parseEpisode(raw) {
        return new Episode({
            id: String(raw.id),
            title: raw.title || `Chapter ${raw.chapter_number}`,
            order: raw.chapter_number || raw.order || 0,
            uploadTime: raw.uploaded_at ? new Date(raw.uploaded_at).getTime() : Date.now(),
            pages: this._parsePages(raw.pages || raw.images || []),
            volume: raw.volume_number,
            chapter: raw.chapter_number,
            translator: raw.translation_group || raw.translator,
            scanlator: raw.scanlation_group || raw.scanlator,
            language: raw.language || 'en',
            quality: raw.quality || 'high',
            isPreview: raw.is_preview || false
        });
    }
    
    /**
     * Parse page URLs into Page objects
     * @param {string[]} pageUrls - Array of image URLs
     * @returns {Page[]}
     * @private
     */
    _parsePages(pageUrls) {
        return pageUrls.map((url, index) => new Page({
            id: `page-${index + 1}`,
            url: url,
            order: index + 1
        }));
    }
    
    /**
     * Map source status to Venera status
     * @param {string} rawStatus - Raw status from source
     * @returns {string} Mapped status
     * @private
     */
    _mapStatus(rawStatus) {
        const statusMap = {
            'ongoing': 'ongoing',
            'completed': 'completed', 
            'hiatus': 'hiatus',
            'cancelled': 'cancelled',
            'finished': 'completed',
            'publishing': 'ongoing',
            'discontinued': 'cancelled'
        };
        
        const normalized = (rawStatus || '').toLowerCase();
        return statusMap[normalized] || 'unknown';
    }
    
    /**
     * Map content rating
     * @param {boolean} isAdult - Whether content is adult
     * @returns {string} Content rating
     * @private
     */
    _mapContentRating(isAdult) {
        return isAdult ? 'adult' : 'teen';
    }
}

// Note: Venera automatically detects and registers ComicSource subclasses
// Source files can be placed in any directory within the project