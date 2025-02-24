// baseReviewPlugin.js
const moment = require('moment');

class BaseReviewPlugin {
  constructor() {
    // Identification & versioning – must be overridden by subclass.
    this.pluginName = 'base';
    this.version = '0.0.1';
    // Whether the site requires authentication.
    this.requiresAuth = false;
    // If the website requires auth, write the url to the login page
    this.loginUrl = null;
    // Pagination mode: "viewMore", "lazyLoad", or "paginated"
    this.paginationMode = null;
    // Optional expected elements for health-checks.
    this.expectedElements = {};
    // Available filters if any.
    this.availableFilters = {};
  }

  /**
   * Extract reviews from the current page.
   * Must return a Promise resolving to an array of review objects.
   * Each review object should include at minimum:
   *  - comment
   *  - review_date (raw)
   *  - reviewer_name
   *  - rating
   * Optionally, extra metadata can be included.
   */
  async extractReviews(page) {
    throw new Error('extractReviews() must be implemented by the plugin.');
  }

  /**
   * Normalize a raw date string (e.g. "2 days ago") into an ISO date string.
   * @param {string} rawDateStr 
   * @returns {string} ISO date
   */
  normalizeDate(rawDateStr) {
    if (rawDateStr.toLowerCase().includes('ago')) {
      const parts = rawDateStr.split(' ');
      const num = parseInt(parts[0]);
      if (!isNaN(num) && parts.length >= 2) {
        return moment().subtract(num, parts[1]).toISOString();
      }
      return moment().toISOString();
    }
    const m = moment(rawDateStr, moment.ISO_8601, true);
    return m.isValid() ? m.toISOString() : rawDateStr;
  }

  /**
   * (Optional) Extract global review statistics (e.g. overall rating).
   * Must return a Promise resolving to an object.
   */
  async extractGlobalStats(page) {
    throw new Error('extractGlobalStats() must be implemented by the plugin.');
  }

  // ------------------------------
  // Pagination Functions
  // ------------------------------

  /**
   * For "viewMore" or "lazyLoad" modes: check if more reviews can be loaded.
   */
  async hasMoreReviews(page) {
    throw new Error('hasMoreReviews() must be implemented by the plugin.');
  }

  /**
   * For "viewMore" mode: simulate a click on the "View More" button.
   */
  async clickLoadMore(page) {
    throw new Error('clickLoadMore() must be implemented by the plugin.');
  }

  /**
   * For "lazyLoad" mode: simulate scrolling to trigger loading of more reviews.
   */
  async simulateScroll(page) {
    throw new Error('simulateScroll() must be implemented by the plugin.');
  }

  /**
   * For "paginated" mode: return the URL for the next page, or null if none exists.
   */
  async getNextPageUrl(page) {
    throw new Error('getNextPageUrl() must be implemented by the plugin.');
  }

  /**
   * (Optional) Apply a filter (e.g., "most_recent", "best") to the page.
   * By default, does nothing.
   */
  async applyFilter(page, filter) {
    // Default implementation: do nothing.
    return;
  }
}

module.exports = BaseReviewPlugin;
