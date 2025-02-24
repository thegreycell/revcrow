// api.js
const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // simple file upload handling
const { crawlReviews } = require('./crawlReviews');
// For plugin config management (stubbed out for now)
const pluginConfigStore = {}; 

const app = express();
const port = process.env.PORT || 8080;

// Endpoint: GET /reviews/aggregate?sourceUrl=...&sourceName=...&filterDate=...
app.get('/reviews/aggregate', async (req, res) => {
  const { sourceUrl, sourceName, filterDate } = req.query;
  if (!sourceUrl || !sourceName) {
    return res.status(400).json({
      response_code: 400,
      error: { message: "Missing required parameters: sourceUrl and sourceName" }
    });
  }
  try {
    const result = await crawlReviews(sourceUrl, sourceName, filterDate);
    res.status(200).json(result);
  } catch (err) {
    console.error("Crawl error:", err);
    res.status(400).json({
      response_code: 400,
      error: { message: "Network Issue" }
    });
  }
});

// Endpoint: POST /jobs
// Accepts a file upload (CSV) or JSON payload with product URLs, sourceName, and optional auth.
// For simplicity, we simulate job submission and return a jobId.
app.post('/jobs', upload.single('file'), async (req, res) => {
  // Parse file or JSON body here and persist job/task records.
  // For now, we simply return a stub jobId.
  const jobId = 'JOB' + Date.now();
  res.status(200).json({
    jobId,
    message: "Job submitted successfully",
    totalTasks: 0 // Stub value; in a real system, calculate tasks from the file.
  });
});

// Endpoint: POST /plugins to add/update plugin configuration.
app.post('/plugins', express.json(), async (req, res) => {
  const config = req.body;
  if (!config.pluginName) {
    return res.status(400).json({
      response_code: 400,
      error: { message: "Missing pluginName in request body" }
    });
  }
  // In a real system, save to a persistent store.
  pluginConfigStore[config.pluginName] = config;
  res.status(200).json({ message: "Plugin configuration saved successfully" });
});

app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});
