// taskProcessor.js
const { MongoClient } = require('mongodb');
const redisQueue = require('../services/redisQueue');

const mongoUrl = 'mongodb://localhost:27017';
const dbName = 'myCrawlerDB';
const client = new MongoClient(mongoUrl);
const tasksCollectionName = 'tasks';

async function main() {
  await client.connect();
  console.log("Task Processor connected to MongoDB");
  const db = client.db(dbName);
  const tasksCollection = db.collection(tasksCollectionName);
  
  const changeStream = tasksCollection.watch([
    { $match: { 'fullDocument.status': 'pending' } }
  ]);
  
  console.log("Task Processor: Listening for new tasks...");
  changeStream.on('change', (change) => {
    if (change.operationType === 'insert') {
      const task = change.fullDocument;
      console.log(`New task detected: ${task._id}`);
      // Add a timestamp for visibility timeout tracking.
      task.timestamp = Date.now();
      redisQueue.lpushAsync = redisQueue.lpushAsync || require('util').promisify(require('redis').createClient({ host: 'localhost', port: 6379 }).lpush).bind(redis.createClient());
      // Push task to pending queue.
      require('redis').createClient({ host: 'localhost', port: 6379 }).lpush(redisQueue.PENDING_QUEUE, JSON.stringify(task), (err, reply) => {
        if (err) {
          console.error("Error pushing task to Redis:", err);
        } else {
          console.log(`Task ${task._id} pushed to Redis. Queue length: ${reply}`);
        }
      });
    }
  });
  
  changeStream.on('error', (err) => {
    console.error("Change stream error:", err);
  });
}

main();
