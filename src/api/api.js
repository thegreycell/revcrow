// api.js
const express = require('express');
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { crawlReviews } = require('./crawlReviews');
const { createJob, getJobs } = require('../db/db');

const app = express();
const port = process.env.PORT || 8080;
// Add this before other middleware
app.use((req, res, next) => {
  console.log('Request URL:', req.url);
  next();
});

// API routes with /api prefix
app.post('/api/job', express.json(), async (req, res) => {
  const { sourceUrl, sourceName } = req.body;
  if (!sourceUrl || !sourceName) {
    return res.status(400).json({
      response_code: 400,
      error: { message: "Missing required parameters: sourceUrl and sourceName" }
    });
  }

  try {
    const jobData = {
      sourceUrl,
      sourceName,
      type: 'single',
      metadata: {
        submittedAt: new Date()
      }
    };

    const jobId = await createJob(jobData);

    res.status(200).json({
      jobId,
      message: "Single job created successfully",
      sourceUrl,
      sourceName
    });
  } catch (err) {
    console.error("Job creation error:", err);
    res.status(500).json({
      response_code: 500,
      error: { message: "Failed to create job" }
    });
  }
});

// API routes should come first
app.get('/api/jobs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await getJobs(page, limit);
    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching jobs:", err);
    res.status(500).json({
      error: { message: "Failed to fetch jobs" }
    });
  }
});

// Static files come next
app.use(express.static(path.join(__dirname, '../../src/ui/build')));

// React routing handler comes last
app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, '../../src/ui/build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

