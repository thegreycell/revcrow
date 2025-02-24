// plugins/zocdoc.js
const BaseReviewPlugin = require('../baseReviewPlugin');

class ZocdocPlugin extends BaseReviewPlugin {
  constructor() {
    super();
    this.pluginName = 'zocdoc';
    this.version = '1.0.0';
    this.requiresAuth = false;
    this.paginationMode = 'viewMore';
    
    // Define XPath selectors (adjust these as per actual Zocdoc DOM).
    this.reviewContainerXPath = "//div[contains(@data-testid, 'review-item')]";
    this.commentXPath = ".//p[contains(@data-testid, 'review-comment')]";
    this.dateXPath = ".//span[contains(@data-testid, 'review-date')]";
    this.reviewerXPath = ".//span[contains(@data-testid, 'reviewer-name')]";
    this.ratingXPath = ".//span[contains(@data-testid, 'review-rating')]";
    
    // Global stats XPaths.
    this.overallRatingXPath = "//span[contains(@data-testid, 'overall-rating')]";
    this.waitTimeXPath = "//span[contains(@data-testid, 'wait-time')]";
    this.bedsideMannerXPath = "//span[contains(@data-testid, 'bedside-manner')]";
    
    // "View More" button XPath.
    this.viewMoreXPath = "//button[contains(text(),'View More')]";
  }
  
  async extractReviews(page) {
    await page.waitForXPath(this.reviewContainerXPath);
    const containers = await page.$x(this.reviewContainerXPath);
    const reviews = [];
    for (let container of containers) {
      const [commentEl] = await container.$x(this.commentXPath);
      const [dateEl] = await container.$x(this.dateXPath);
      const [reviewerEl] = await container.$x(this.reviewerXPath);
      const [ratingEl] = await container.$x(this.ratingXPath);
      
      const comment = commentEl ? await page.evaluate(el => el.innerText.trim(), commentEl) : '';
      const rawDate = dateEl ? await page.evaluate(el => el.innerText.trim(), dateEl) : '';
      const reviewer = reviewerEl ? await page.evaluate(el => el.innerText.trim(), reviewerEl) : '';
      const rating = ratingEl ? await page.evaluate(el => el.innerText.trim(), ratingEl) : '';
      
      reviews.push({
        comment,
        review_date: rawDate,
        reviewer_name: reviewer,
        rating
      });
    }
    return reviews;
  }
  
  async extractGlobalStats(page) {
    await page.waitForXPath(this.overallRatingXPath);
    const [overallEl] = await page.$x(this.overallRatingXPath);
    const [waitTimeEl] = await page.$x(this.waitTimeXPath);
    const [bedsideEl] = await page.$x(this.bedsideMannerXPath);
    const overallRating = overallEl ? await page.evaluate(el => el.innerText.trim(), overallEl) : null;
    const waitTime = waitTimeEl ? await page.evaluate(el => el.innerText.trim(), waitTimeEl) : null;
    const bedsideManner = bedsideEl ? await page.evaluate(el => el.innerText.trim(), bedsideEl) : null;
    return { overallRating, waitTime, bedsideManner };
  }
  
  async hasMoreReviews(page) {
    const elements = await page.$x(this.viewMoreXPath);
    return elements.length > 0;
  }
  
  async clickLoadMore(page) {
    const elements = await page.$x(this.viewMoreXPath);
    if (elements.length > 0) {
      await elements[0].click();
      await page.waitForTimeout(2000);
    }
  }
  
  async simulateScroll(page) {
    // Not applicable for Zocdoc.
    return;
  }
  
  async getNextPageUrl(page) {
    // Not applicable in "viewMore" mode.
    return null;
  }
  
  async applyFilter(page, filter) {
    // Zocdoc does not provide extra filters.
    return;
  }
}

module.exports = new ZocdocPlugin();
