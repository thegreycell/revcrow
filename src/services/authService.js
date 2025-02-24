// authService.js
const puppeteer = require('puppeteer');

const sessions = {}; // Cache: key = pluginName, value = { headers, expiry, promise }

/**
 * Performs login using Puppeteer and returns session headers (e.g. Cookie header) and expiry.
 * @param {Object} plugin - Plugin object (for identification)
 * @param {Object} auth - Authentication details (loginUrl, username, password, selectors)
 * @returns {Promise<Object>} - { headers, expiry }
 */
async function authenticate(plugin, auth) {
  console.log(`[AuthService] Authenticating for plugin ${plugin.pluginName}`);
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(auth.loginUrl, { waitUntil: 'networkidle2' });
  
  // Fill in login form using provided selectors (or defaults)
  await page.type(auth.usernameSelector || '#username', auth.username);
  await page.type(auth.passwordSelector || '#password', auth.password);
  
  await Promise.all([
    page.click(auth.submitSelector || '#loginBtn'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);
  
  // Extract cookies as session headers
  const cookies = await page.cookies();
  await browser.close();
  
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  // Set expiry 1 hour from now (this can be adjusted)
  const expiry = Date.now() + 3600 * 1000;
  console.log(`[AuthService] Authentication successful for ${plugin.pluginName}`);
  return { headers: { Cookie: cookieHeader }, expiry };
}

/**
 * Retrieves a valid session for the given plugin and auth credentials.
 * If a valid session is cached, returns it immediately.
 * Otherwise, triggers an authentication process.
 * @param {Object} plugin 
 * @param {Object} auth 
 */
async function getSession(plugin, auth) {
  const key = plugin.pluginName || plugin.name || 'default';
  // Return the cached session if it's still valid.
  if (sessions[key] && sessions[key].expiry > Date.now()) {
    return sessions[key].headers;
  }
  // If an authentication promise is already in progress, return that.
  if (sessions[key] && sessions[key].promise) {
    return sessions[key].promise;
  }
  // Otherwise, start a new authentication process.
  const authPromise = authenticate(plugin, auth)
    .then(session => {
      sessions[key] = { headers: session.headers, expiry: session.expiry, promise: null };
      return session.headers;
    })
    .catch(err => {
      sessions[key] = null;
      throw err;
    });
  sessions[key] = { promise: authPromise };
  return authPromise;
}

/**
 * Forces a refresh of the session.
 * @param {Object} plugin 
 * @param {Object} auth 
 */
async function refreshSession(plugin, auth) {
  const key = plugin.pluginName || plugin.name || 'default';
  const session = await authenticate(plugin, auth);
  sessions[key] = { headers: session.headers, expiry: session.expiry, promise: null };
  return session.headers;
}

module.exports = {
  getSession,
  refreshSession
};
