const NodeCache = require('node-cache');

class CacheService {
    constructor() {
        this.cache = new NodeCache({
            stdTTL: 86400, // 24 hours
            checkperiod: 3600, // Check for expired keys every hour
            useClones: false,
            deleteOnExpire: true,
            maxKeys: 1000 // Prevent memory overload
        });

        // Cache statistics tracking
        this.stats = {
            hits: 0,
            misses: 0
        };
    }

    async get(key) {
        const value = this.cache.get(key);
        if (value) {
            this.stats.hits++;
            return value;
        }
        this.stats.misses++;
        return null;
    }

    async set(key, value, ttl = 86400) {
        return this.cache.set(key, value, ttl);
    }

    async del(key) {
        return this.cache.del(key);
    }

    flush() {
        return this.cache.flushAll();
    }

    getStats() {
        return {
            ...this.stats,
            keys: this.cache.keys().length,
            hitRate: (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
        };
    }
}

module.exports = new CacheService();
