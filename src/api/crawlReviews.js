// crawlReviews.js
const { Worker } = require('worker_threads');
const path = require('path');

function crawlReviews(sourceUrl, sourceName, filterDate) {
  return new Promise((resolve, reject) => {
    const job = {
      url: sourceUrl,
      pluginName: sourceName,
      filterDate: filterDate || null,
      initialDelay: 1000,
      maxDelay: 16000,
      productUrl: sourceUrl // used for meta data
    };

    const worker = new Worker(path.join(__dirname, 'extractWorker.js'), {
      workerData: { job }
    });

    worker.on('message', (data) => {
      if (data.error) return reject(data.error);
      let reviews = data.reviews;
      if (filterDate) {
        reviews = reviews.filter(r => new Date(r.review_date) >= new Date(filterDate));
      }
      reviews.sort((a, b) => new Date(b.review_date) - new Date(a.review_date));
      resolve({
        review_count: reviews.length,
        aggregated_reviews: reviews,
        review_aggregated_count: reviews.length,
        totalReviewCount: data.totalReviewCount,
        response_code: 200
      });
    });

    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
}

module.exports = { crawlReviews };
