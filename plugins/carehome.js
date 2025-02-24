// plugins/carehome.js
const BaseReviewPlugin = require('../baseReviewPlugin');

class CarehomePlugin extends BaseReviewPlugin {
  constructor() {
    super();
    this.pluginName = 'carehome';
    this.version = '1.0.0';
    this.requiresAuth = false;
    this.paginationMode = 'paginated';
    
    // Define XPath selectors (adjust based on actual Carehome DOM)
    this.reviewContainerXPath = "//div[contains(@class, 'review')]";
    this.reviewBodyXPath = ".//div[contains(@class, 'review-body')]";
    this.dateXPath = ".//span[contains(@class, 'review-date')]";
    this.reviewerXPath = ".//span[contains(@class, 'reviewer')]";
    this.ratingXPath = ".//span[contains(@class, 'rating')]";
    // Additional metadata (if available) may be in a list
    this.metadataXPath = ".//ul[contains(@class, 'review-stats')]";
    
    // Pagination: Assume a "Next" link is available.
    this.nextPageXPath = "//a[contains(text(),'Next')]";
    
    // Available filters: example "most_recent" and "best"
    this.availableFilters = {
      most_recent: { type: 'click', xpath: "//a[contains(text(),'Most Recent')]" },
      best: { type: 'click', xpath: "//a[contains(text(),'Best')]" }
    };
  }
  
  async extractReviews(page) {
    await page.waitForXPath(this.reviewContainerXPath);
    const containers = await page.$x(this.reviewContainerXPath);
    const reviews = [];
    for (let container of containers) {
      const [bodyEl] = await container.$x(this.reviewBodyXPath);
      const [dateEl] = await container.$x(this.dateXPath);
      const [reviewerEl] = await container.$x(this.reviewerXPath);
      const [ratingEl] = await container.$x(this.ratingXPath);
      
      const reviewBody = bodyEl ? await page.evaluate(el => el.innerText.trim(), bodyEl) : '';
      const rawDate = dateEl ? await page.evaluate(el => el.innerText.trim(), dateEl) : '';
      const reviewer = reviewerEl ? await page.evaluate(el => el.innerText.trim(), reviewerEl) : '';
      const rating = ratingEl ? await page.evaluate(el => el.innerText.trim(), ratingEl) : '';
      
      let metadata = {};
      const [metaEl] = await container.$x(this.metadataXPath);
      if (metaEl) {
        const metaText = await page.evaluate(el => el.innerText.trim(), metaEl);
        try {
          metadata = JSON.parse(metaText);
        } catch (err) {
          metadata = { details: metaText };
        }
      }
      
      reviews.push({
        reviewBody,
        review_date: rawDate,
        reviewer_name: reviewer,
        rating,
        metadata
      });
    }
    return reviews;
  }
  
  async extractGlobalStats(page) {
    // Implement extraction if Carehome displays global stats.
    return {};
  }
  
  async getNextPageUrl(page) {
    const [nextEl] = await page.$x(this.nextPageXPath);
    if (nextEl) {
      return await page.evaluate(el => el.href, nextEl);
    }
    return null;
  }
  
  async applyFilter(page, filter) {
    if (filter && this.availableFilters[filter]) {
      const config = this.availableFilters[filter];
      if (config.type === 'click') {
        const [filterEl] = await page.$x(config.xpath);
        if (filterEl) {
          await filterEl.click();
          await page.waitForTimeout(2000);
        }
      }
    }
  }
  
  async hasMoreReviews(page) {
    const nextUrl = await this.getNextPageUrl(page);
    return nextUrl !== null;
  }
  
  async clickLoadMore(page) {
    // Not applicable for paginated mode.
    return;
  }
  
  async simulateScroll(page) {
    // Not applicable for paginated mode.
    return;
  }
}

module.exports = new CarehomePlugin();
