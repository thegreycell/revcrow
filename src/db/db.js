// db.js
const { MongoClient } = require('mongodb');
const crypto = require('crypto');

const url = 'mongodb://localhost:27017'; // adjust as needed
const dbName = 'myCrawlerDB';
const client = new MongoClient(url);

async function connectDB() {
  if (!client.isConnected()) {
    await client.connect();
  }
  return client.db(dbName);
}

function computeReviewHash(review) {
  return crypto.createHash('sha256')
    .update(review.reviewer_name + review.comment)
    .digest('hex');
}

async function saveReview(review) {
  const db = await connectDB();
  const collection = db.collection('reviews');
  const hash = computeReviewHash(review);
  review._id = hash;
  try {
    await collection.updateOne(
      { _id: hash },
      { $setOnInsert: review },
      { upsert: true }
    );
  } catch (err) {
    console.error("Error saving review:", err);
  }
}

module.exports = { saveReview };
