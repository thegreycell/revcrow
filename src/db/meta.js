// meta.js
const { MongoClient } = require('mongodb');
const url = 'mongodb://localhost:27017'; // adjust as needed
const dbName = 'myCrawlerDB';
const client = new MongoClient(url);

async function connectDB() {
  if (!client.isConnected()) await client.connect();
  return client.db(dbName);
}

async function updateMeta(meta) {
  const db = await connectDB();
  const collection = db.collection('crawl_meta');
  await collection.updateOne(
    { productUrl: meta.productUrl },
    { $set: meta },
    { upsert: true }
  );
}

async function getMeta(productUrl) {
  const db = await connectDB();
  const collection = db.collection('crawl_meta');
  return await collection.findOne({ productUrl });
}

module.exports = { updateMeta, getMeta };
