// jobQueue.js
class JobQueue {
    constructor(options = {}) {
      this.maxJobsPerInterval = options.maxJobsPerInterval || 60;
      this.intervalMs = options.intervalMs || 60000;
      this.queue = [];
      this.currentJobs = 0;
      setInterval(() => {
        this.currentJobs = 0;
      }, this.intervalMs);
    }
  
    push(job) {
      this.queue.push(job);
    }
  
    pop() {
      if (this.currentJobs < this.maxJobsPerInterval && this.queue.length > 0) {
        this.currentJobs++;
        return this.queue.shift();
      }
      return null;
    }
  
    isEmpty() {
      return this.queue.length === 0;
    }
  }
  
  module.exports = JobQueue;
  