// db.js
const { MongoClient } = require('mongodb');
const crypto = require('crypto');

const url = 'mongodb://mongodb:27017';  // Changed from localhost to mongodb
const dbName = 'revcrowDB';
const client = new MongoClient(url);
async function connectDB() {
  if (!client.topology || !client.topology.isConnected()) {
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

async function createJob(jobData) {
  const db = await connectDB();
  const jobs = db.collection('jobs');
  
  const job = {
    ...jobData,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    totalTasks: 0,
    completedTasks: 0
  };

  const result = await jobs.insertOne(job);
  return result.insertedId;
}

async function createTask(jobId, taskData) {
  const db = await connectDB();
  const tasks = db.collection('tasks');
  
  const task = {
    jobId,
    url: taskData.url,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await tasks.insertOne(task);
  
  // Update job's task count
  await db.collection('jobs').updateOne(
    { _id: jobId },
    { $inc: { totalTasks: 1 } }
  );
}

async function getTasksByJobId(jobId) {
  const db = await connectDB();
  return await db.collection('tasks')
    .find({ jobId })
    .toArray();
}

async function updateTaskStatus(taskId, status) {
  const db = await connectDB();
  const tasks = db.collection('tasks');
  
  await tasks.updateOne(
    { _id: taskId },
    { 
      $set: { 
        status,
        updatedAt: new Date()
      }
    }
  );

  if (status === 'completed') {
    const task = await tasks.findOne({ _id: taskId });
    await db.collection('jobs').updateOne(
      { _id: task.jobId },
      { $inc: { completedTasks: 1 } }
    );
  }
}

async function updateJobStatus(jobId, status) {
  const db = await connectDB();
  const jobs = db.collection('jobs');
  
  await jobs.updateOne(
    { _id: jobId },
    { 
      $set: { 
        status: status,
        updatedAt: new Date()
      }
    }
  );
}

async function getJob(jobId) {
  const db = await connectDB();
  const jobs = db.collection('jobs');
  return await jobs.findOne({ _id: jobId });
}
async function getJobs(page = 1, limit = 10) {
  const db = await connectDB();
  const jobs = db.collection('jobs');
  
  const skip = (page - 1) * limit;
  const totalJobs = await jobs.countDocuments();
  
  const jobsList = await jobs
    .find({})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return {
    jobs: jobsList,
    totalJobs,
    currentPage: page,
    totalPages: Math.ceil(totalJobs / limit)
  };
}

module.exports = { 
  saveReview, 
  createJob,
  updateJobStatus,
  getJob,
  getJobs 
};