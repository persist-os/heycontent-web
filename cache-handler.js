// Simple cache handler that bypasses caching
module.exports = class CacheHandler {
  constructor(options) {
    this.options = options;
  }

  async get(key) {
    return null; // Always return null to force re-fetch
  }

  async set(key, data) {
    // No-op
  }

  async revalidateTag(tag) {
    // No-op
  }
};
