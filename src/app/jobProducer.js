// jobProducer.js
const fs = require('fs');
const csv = require('csv-parser');

function processJobsFromFile(filePath) {
  return new Promise((resolve, reject) => {
    const jobs = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Assume CSV columns: productUrl, pluginName, username, password, etc.
        jobs.push(row);
      })
      .on('end', () => {
        resolve(jobs);
      })
      .on('error', reject);
  });
}

module.exports = { processJobsFromFile };
