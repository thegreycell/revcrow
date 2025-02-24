// extractWorker.js
const { parentPort, workerData } = require('worker_threads');
const puppeteer = require('puppeteer');
const path = require('path');
const authService = require('./authService');

(async () => {
  const { job } = workerData;
  
  // Load the appropriate plugin using job.pluginName.
  const pluginPath = path.join(__dirname, 'plugins', `${job.pluginName}.js`);
  let plugin;
  try {
    plugin = require(pluginPath);
  } catch (err) {
    parentPort.postMessage({ error: `Plugin ${job.pluginName} not found.` });
    process.exit(1);
  }

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // If authentication is required, obtain a valid session.
  if (plugin.requiresAuth) {
    // The plugin should define a loginUrl (or you provide it in job.auth).
    if (!job.auth || !job.auth.loginUrl) {
      parentPort.postMessage({ error: "Authentication required but no auth info provided." });
      await browser.close();
      process.exit(1);
    }
    try {
      // Get cached session headers (e.g. Cookie header) via the auth service.
      const sessionHeaders = await authService.getSession(plugin, job.auth);
      await page.setExtraHTTPHeaders(sessionHeaders);
    } catch (err) {
      parentPort.postMessage({ error: err.message });
      await browser.close();
      process.exit(1);
    }
  }

  // Navigate to the target URL.
  try {
    await page.goto(job.url, { waitUntil: 'networkidle2' });
  } catch (err) {
    parentPort.postMessage({ error: "Failed to load page: " + err.message });
    await browser.close();
    process.exit(1);
  }

  // Exponential backoff variables.
  let backoffDelay = job.initialDelay || 1000;
  const maxDelay = job.maxDelay || 16000;
  
  // A safe extraction function that refreshes the session if a 403 or rate limit error is encountered.
  async function safeExtract() {
    try {
      return await plugin.extractReviews(page);
    } catch (err) {
      if (err.message && (err.message.includes('403') || err.message.includes('rate limit'))) {
        console.warn(`Auth/rate-limit error detected. Waiting ${backoffDelay}ms and refreshing session...`);
        if (plugin.requiresAuth) {
          try {
            const newSession = await authService.refreshSession(plugin, job.auth);
            await page.setExtraHTTPHeaders(newSession);
          } catch (authErr) {
            throw new Error("Failed to refresh session: " + authErr.message);
          }
        }
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        backoffDelay = Math.min(backoffDelay * 2, maxDelay);
        return await safeExtract();
      } else {
        throw err;
      }
    }
  }

  let reviews;
  try {
    reviews = await safeExtract();
  } catch (err) {
    parentPort.postMessage({ error: err.message });
    await browser.close();
    process.exit(1);
  }

  // Optionally extract total review count.
  let totalReviewCount = null;
  if (plugin.getTotalReviewCount && typeof plugin.getTotalReviewCount === 'function') {
    try {
      totalReviewCount = await plugin.getTotalReviewCount(page);
    } catch (err) {
      totalReviewCount = null;
    }
  }

  // Handle pagination.
  let nextPageUrl = null;
  if (plugin.paginationMode === 'paginated') {
    try {
      nextPageUrl = await plugin.getNextPageUrl(page);
    } catch (err) {
      nextPageUrl = null;
    }
  } else if (plugin.paginationMode === 'viewMore') {
    try {
      const hasMore = await plugin.hasMoreReviews(page);
      if (hasMore) {
        await plugin.clickLoadMore(page);
        // For viewMore mode, typically you process one click per task.
        // Additional tasks can be created if needed.
      }
    } catch (err) {
      nextPageUrl = null;
    }
  }
  
  await browser.close();
  parentPort.postMessage({ reviews, nextPageUrl, totalReviewCount });
})();
