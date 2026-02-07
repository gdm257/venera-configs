/**
 * Venera Comic Source Template
 *
 * Copy this file and modify for your source.
 * See comments for guidance on each section.
 */

class MyComicSource extends ComicSource {
    // ===== REQUIRED: Source Metadata =====

    /** Display name of the source */
    name = "My Comic Source"

    /** Unique identifier (letters, numbers, underscores only) */
    key = "my_comic_source"

    /** Source version (semver format recommended) */
    version = "1.0.0"

    /** Minimum required Venera app version */
    minAppVersion = "1.0.0"

    /** URL to fetch source updates (optional but recommended) */
    url = "https://example.com/sources/my_source.js"

    // ===== OPTIONAL: Source Configuration =====

    /** Set to true if source requires user login */
    requireLogin = false

    /** Set to true to enable explore page with filters */
    useExplorePage = false

    /**
     * Explore page filter configuration
     * Only used when useExplorePage = true
     */
    explorePage = [
        {
            title: "Category",
            type: "singleSelect",
            options: ["All", "Action", "Adventure", "Comedy", "Drama"]
        },
        {
            title: "Status",
            type: "singleSelect",
            options: ["All", "Ongoing", "Completed", "Hiatus"]
        },
        {
            title: "Sort By",
            type: "singleSelect",
            options: ["Latest", "Popular", "Rating"]
        }
    ]

    // ===== OPTIONAL: Helper Methods =====

    /**
     * Build API URL with query parameters
     * @param {string} endpoint - API endpoint path
     * @param {Object} params - Query parameters
     * @returns {string} Full URL
     */
    buildUrl(endpoint, params = {}) {
        const baseUrl = "https://api.example.com"
        const query = Object.entries(params)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join('&')

        return query
            ? `${baseUrl}${endpoint}?${query}`
            : `${baseUrl}${endpoint}`
    }

    /**
     * Parse standard API response to Comic objects
     * @param {Object} data - API response data
     * @returns {Comic[]} Array of Comic objects
     */
    parseComics(data) {
        if (!Array.isArray(data)) {
            console.warn("Expected array, got:", typeof data)
            return []
        }

        return data.map(item => {
            try {
                return new Comic({
                    id: String(item.id || item.manga_id || item.slug),
                    title: item.title || item.name || "Untitled",
                    cover: item.cover || item.cover_url || item.thumbnail || "",
                    subtitle: item.author || item.artist || item.subtitle || "",
                    tags: item.genres || item.tags || item.categories || [],
                    description: item.description || item.summary || item.synopsis || "",
                    language: item.language || item.lang || "",
                    stars: item.rating || item.score || item.stars || 0
                })
            } catch (e) {
                console.error("Failed to parse comic:", e, item)
                return null
            }
        }).filter(c => c !== null)
    }

    /**
     * Extract ID from URL
     * @param {string} url - Source URL
     * @returns {string|null} Extracted ID
     */
    extractId(url) {
        if (!url) return null

        // Try common patterns
        const patterns = [
            /\/manga\/(\d+)/,
            /\/comic\/(\w+)/,
            /\/title\/(\d+)/,
            /[?\u0026]id=(\d+)/,
            /\/(\d+)\.html?$/
        ]

        for (const pattern of patterns) {
            const match = url.match(pattern)
            if (match) return match[1]
        }

        // Fallback: use last path segment
        const segments = url.split('/').filter(s => s)
        const last = segments[segments.length - 1]
        return last?.replace(/\.html?$/, '') || null
    }

    /**
     * Resolve relative URL to absolute
     * @param {string} url - Possibly relative URL
     * @param {string} base - Base URL
     * @returns {string} Absolute URL
     */
    resolveUrl(url, base = "https://example.com") {
        if (!url) return ''
        if (url.startsWith('http')) return url
        if (url.startsWith('//')) return `https:${url}`

        const baseUrl = base.replace(/\/$/, '')
        if (url.startsWith('/')) return `${baseUrl}${url}`

        return `${baseUrl}/${url}`
    }

    // ===== REQUIRED: Core API Methods =====

    /**
     * Get popular/recommended comics
     * @param {number} page - Page number (starts from 1)
     * @returns {Comic[]|{comics: Comic[], maxPage?: number}} Comics or result object
     */
    async getPopular(page) {
        // Example implementation
        const res = await Network.get(
            this.buildUrl('/manga/popular', {page})
        )

        if (res.statusCode !== 200) {
            throw new Error(`HTTP ${res.statusCode}: ${res.body}`)
        }

        const data = JSON.parse(res.body)
        return this.parseComics(data.manga || data.data || data.results)
    }

    /**
     * Get latest updated comics
     * @param {number} page - Page number
     * @returns {Comic[]|{comics: Comic[], maxPage?: number}}
     */
    async getLatest(page) {
        // Similar to getPopular
        const res = await Network.get(
            this.buildUrl('/manga/latest', {page})
        )

        const data = JSON.parse(res.body)
        return this.parseComics(data.manga || data.data || data.results)
    }

    /**
     * Search comics
     * @param {string} keyword - Search keyword
     * @param {number} page - Page number
     * @param {Object} options - Search options (filters)
     * @returns {Comic[]|{comics: Comic[], maxPage?: number}}
     */
    async search(keyword, page, options) {
        const params = {
            q: keyword,
            page: page,
            ...options  // Spread any filter options
        }

        const res = await Network.get(
            this.buildUrl('/search', params)
        )

        const data = JSON.parse(res.body)

        return {
            comics: this.parseComics(data.manga || data.data || data.results),
            maxPage: data.total_pages || data.last_page || null
        }
    }

    /**
     * Load comic details
     * @param {string} id - Comic ID
     * @returns {ComicDetails}
     */
    async loadInfo(id) {
        const res = await Network.get(
            this.buildUrl(`/manga/${id}`)
        )

        const data = JSON.parse(res.body)
        const manga = data.manga || data.data || data

        return new ComicDetails({
            title: manga.title,
            subtitle: manga.alternative_titles?.join(', ') || '',
            cover: manga.cover || manga.cover_url,
            description: manga.description || manga.summary || manga.synopsis,
            tags: {
                "Genre": manga.genres || manga.tags || [],
                "Author": manga.authors || [manga.author].filter(Boolean),
                "Status": [manga.status].filter(Boolean)
            },
            chapters: (manga.chapters || []).map(ch => ({
                title: ch.title || `Chapter ${ch.number}`,
                id: String(ch.id || ch.chapter_id),
                time: ch.updated_at || ch.release_date,
                page: ch.page_count || ch.pages
            })),
            isFavorite: manga.is_favorite || manga.is_bookmarked,
            recommend: (manga.recommendations || []).map(r => new Comic({
                id: String(r.id),
                title: r.title,
                cover: r.cover || r.cover_url
            })),
            commentCount: manga.comment_count || manga.comments_count,
            likesCount: manga.likes_count || manga.favorites_count,
            isLiked: manga.is_liked,
            stars: manga.rating || manga.score
        })
    }

    /**
     * Load chapter images
     * @param {string} comicId - Comic ID
     * @param {string} chapterId - Chapter ID
     * @returns {string[]|{images: string[], maxPage?: number}}
     */
    async loadEp(comicId, chapterId) {
        const res = await Network.get(
            this.buildUrl(`/manga/${comicId}/chapter/${chapterId}`)
        )

        const data = JSON.parse(res.body)

        // Handle different image formats
        let images = []

        if (data.images) {
            images = data.images
        } else if (data.pages) {
            images = data.pages.map(p => p.image_url || p.url)
        } else if (data.chapter?.images) {
            images = data.chapter.images
        }

        // Resolve relative URLs
        images = images.map(url => this.resolveUrl(url))

        return {
            images: images,
            maxPage: images.length
        }
    }

    // ===== OPTIONAL: Advanced Methods =====

    /**
     * Explore page with filters (only if useExplorePage = true)
     * @param {number} page - Page number
     * @param {string[]} selectedOptions - Selected filter values
     * @returns {Comic[]}
     */
    async explore(page, selectedOptions) {
        // selectedOptions corresponds to explorePage configuration
        const [category, status, sortBy] = selectedOptions

        const params = {
            page: page,
            category: category !== 'All' ? category : undefined,
            status: status !== 'All' ? status : undefined,
            sort: sortBy.toLowerCase()
        }

        const res = await Network.get(
            this.buildUrl('/manga/filter', params)
        )

        const data = JSON.parse(res.body)
        return this.parseComics(data.manga || data.data)
    }

    /**
     * User login
     * @param {string} username
     * @param {string} password
     * @returns {{success: boolean, message?: string}}
     */
    async login(username, password) {
        const res = await Network.post(
            this.buildUrl('/auth/login'),
            {'Content-Type': 'application/json'},
            JSON.stringify({username, password})
        )

        const data = JSON.parse(res.body)

        if (data.access_token) {
            // Store token for future requests
            this.accessToken = data.access_token
            return {success: true}
        }

        return {
            success: false,
            message: data.message || data.error || "Login failed"
        }
    }

    /**
     * Check if user is logged in
     * @returns {boolean}
     */
    async checkLogin() {
        if (!this.accessToken) return false

        try {
            const res = await Network.get(
                this.buildUrl('/auth/check'),
                {'Authorization': `Bearer ${this.accessToken}`}
            )

            return res.statusCode === 200
        } catch (e) {
            return false
        }
    }

    /**
     * Get user's favorite comics
     * @param {number} page - Page number
     * @returns {Comic[]|{comics: Comic[], maxPage?: number}}
     */
    async getFavorites(page) {
        if (!this.accessToken) {
            throw new Error("Not logged in")
        }

        const res = await Network.get(
            this.buildUrl('/user/favorites', {page}),
            {'Authorization': `Bearer ${this.accessToken}`}
        )

        const data = JSON.parse(res.body)
        return this.parseComics(data.manga || data.data)
    }

    /**
     * Add comic to favorites
     * @param {string} comicId
     * @returns {boolean}
     */
    async addFavorite(comicId) {
        if (!this.accessToken) return false

        const res = await Network.post(
            this.buildUrl(`/manga/${comicId}/favorite`),
            {'Authorization': `Bearer ${this.accessToken}`},
            ''
        )

        return res.statusCode === 200 || res.statusCode === 201
    }

    /**
     * Remove comic from favorites
     * @param {string} comicId
     * @returns {boolean}
     */
    async removeFavorite(comicId) {
        if (!this.accessToken) return false

        const res = await Network.delete(
            this.buildUrl(`/manga/${comicId}/favorite`),
            {'Authorization': `Bearer ${this.accessToken`}
        )

        return res.statusCode === 200 || res.statusCode === 204
    }

    /**
     * Get comments for a comic
     * @param {string} comicId
     * @param {number} page - Page number
     * @param {string|null} replyTo - Parent comment ID for replies
     * @returns {Comment[]}
     */
    async getComments(comicId, page, replyTo = null) {
        const params = {page}
        if (replyTo) params.reply_to = replyTo

        const res = await Network.get(
            this.buildUrl(`/manga/${comicId}/comments`, params)
        )

        const data = JSON.parse(res.body)

        return (data.comments || []).map(c => new Comment({
            userName: c.user?.name || c.username,
            avatar: c.user?.avatar,
            content: c.content || c.text,
            time: c.created_at || c.time,
            replyCount: c.reply_count || c.replies || 0,
            id: String(c.id),
            isLiked: c.is_liked || c.liked,
            score: c.rating || c.score
        }))
    }

    /**
     * Post a comment
     * @param {string} comicId
     * @param {string} content
     * @param {string|null} replyTo - Parent comment ID
     * @returns {boolean}
     */
    async sendComment(comicId, content, replyTo = null) {
        if (!this.accessToken) {
            UI.showMessage("Please login to comment")
            return false
        }

        const body = {content}
        if (replyTo) body.reply_to = replyTo

        const res = await Network.post(
            this.buildUrl(`/manga/${comicId}/comments`),
            {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            JSON.stringify(body)
        )

        if (res.statusCode === 201 || res.statusCode === 200) {
            UI.showMessage("Comment posted")
            return true
        }

        UI.showMessage("Failed to post comment")
        return false
    }

    // ===== IMAGE LOADING CONFIGURATION =====

    /**
     * Configure image loading (optional)
     * Modify the config object to add headers, change URL, etc.
     * @param {ImageLoadingConfig} config
     */
    onImageLoad(config) {
        // Example: Add referer header
        config.headers = config.headers || {}
        config.headers["Referer"] = "https://example.com/"

        // Example: Change request method to POST
        // config.method = "POST"
        // config.data = JSON.stringify({image: config.url})

        // Example: Process response
        // config.onResponse = function(response) {
        //     // Modify response before image loading
        //     return response
        // }
    }

    /**
     * Configure thumbnail loading (optional)
     * @param {ImageLoadingConfig} config
     */
    onThumbnailLoad(config) {
        // Same options as onImageLoad
        config.headers = config.headers || {}
        config.headers["Referer"] = "https://example.com/"
    }
}
