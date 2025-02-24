// redisQueue.js
const redis = require('redis');
const { promisify } = require('util');

const client = redis.createClient({ host: 'localhost', port: 6379 });
client.on('error', err => console.error("Redis error:", err));

const brpoplpushAsync = promisify(client.brpoplpush).bind(client);
const lremAsync = promisify(client.lrem).bind(client);
const lpushAsync = promisify(client.lpush).bind(client);
const lrangeAsync = promisify(client.lrange).bind(client);

const PENDING_QUEUE = 'taskQueue';
const PROCESSING_QUEUE = 'processingQueue';
const VISIBILITY_TIMEOUT = 60000; // 60 seconds

async function getTask() {
  // Block until a task is available; task is atomically moved to processing queue.
  const taskStr = await brpoplpushAsync(PENDING_QUEUE, PROCESSING_QUEUE, 0);
  return JSON.parse(taskStr);
}

async function ackTask(taskStr) {
  // Remove the task from the processing queue.
  await lremAsync(PROCESSING_QUEUE, 1, taskStr);
}

async function requeueTask(taskStr) {
  await lremAsync(PROCESSING_QUEUE, 1, taskStr);
  await lpushAsync(PENDING_QUEUE, taskStr);
}

// Watchdog: periodically check tasks in processing queue and requeue if they exceed VISIBILITY_TIMEOUT.
// We assume each task includes a "timestamp" property.
async function watchdog() {
  try {
    const tasks = await lrangeAsync(PROCESSING_QUEUE, 0, -1);
    const now = Date.now();
    for (let taskStr of tasks) {
      const task = JSON.parse(taskStr);
      if (now - task.timestamp > VISIBILITY_TIMEOUT) {
        console.log("Requeuing task due to timeout:", task);
        await requeueTask(taskStr);
      }
    }
  } catch (err) {
    console.error("Watchdog error:", err);
  }
  setTimeout(watchdog, 30000);
}
watchdog();

module.exports = {
  getTask,
  ackTask,
  requeueTask,
  PENDING_QUEUE,
  PROCESSING_QUEUE
};
