# RevCrow

**RevCrow** is a production-ready review crawler designed to extract reviews from various product websites using a modular, plugin-based architecture. It supports authentication (via a dedicated auth service), reliable task queuing with Redis, scalable extraction workers, and persistent storage of review data and job metadata in MongoDB. The project is containerized and comes with Kubernetes manifests for deployment in environments like Minikube (for local testing) or Amazon EKS (for production).

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running Locally](#running-locally)
  - [Starting MongoDB and Redis](#starting-mongodb-and-redis)
  - [Running the API Server](#running-the-api-server)
  - [Running the Task Processor](#running-the-task-processor)
  - [Running Extraction Workers](#running-extraction-workers)
- [API Endpoints](#api-endpoints)
- [Plugins](#plugins)
  - [Plugin Interface](#plugin-interface)
  - [Example Plugins](#example-plugins)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Scaling & Autoscaling](#scaling--autoscaling)
- [Future Enhancements](#future-enhancements)
- [License](#license)

---

## Overview

RevCrow extracts reviews from product pages by:
- **Accepting Jobs:** The API server accepts job submissions (via JSON or file upload) that contain product URLs, source names (to identify the target website/plugin), and optional authentication credentials.
- **Task Production:** A dedicated task processor listens to MongoDB change streams and pushes new tasks into a reliable Redis queue.
- **Extraction:** Extraction worker pods poll the Redis queue, pick up tasks, and process them using Puppeteer and a plugin that defines the extraction logic. The workers support pagination (either “View More”, lazy load, or traditional paginated pages) and apply rate limiting with exponential backoff.
- **Persistence:** Extracted reviews are saved in MongoDB with deduplication, and job metadata (e.g. progress, total reviews) is persisted for dashboard and reporting.
- **Authentication:** For websites that require authentication, a dedicated auth service caches session headers (cookies) so that workers do not redundantly log in.

---

## Architecture

The system is divided into several components:
1. **API Server:** Exposes REST endpoints for job submission, plugin configuration, and aggregate review retrieval.
2. **Task Processor:** Monitors MongoDB using change streams; when new tasks (with status "pending") are inserted, it pushes them to a Redis queue.
3. **Extraction Workers:** Poll the Redis queue (using reliable BRPOPLPUSH patterns) and process tasks in parallel. They use the plugin system to extract reviews, handle pagination, and update job metadata.
4. **Database (MongoDB):** Stores review data and job/task metadata.
5. **Redis:** Provides a reliable queue for task distribution.
6. **Authentication Service:** A shared service (in-process) that authenticates with target websites and caches session data for workers.
7. **Kubernetes:** The system is containerized and deployed on Kubernetes, with separate pods for the API server, task processor, and extraction workers. Horizontal Pod Autoscaling (HPA) is configured to scale extraction workers based on load.

---

## Project Structure

```
my-crawler/
├── package.json
├── api.js                 # Express API server with job submission and aggregate endpoints
├── baseReviewPlugin.js    # Base class for review extraction plugins
├── crawlReviews.js        # API wrapper for single product extraction
├── db.js                  # MongoDB persistence module for reviews (deduplication)
├── meta.js                # MongoDB persistence module for job/task meta-data
├── redisQueue.js          # Reliable task queue implementation using Redis
├── taskProcessor.js       # Monitors MongoDB change streams and pushes tasks to Redis
├── extractWorker.js       # Extraction worker that polls Redis for tasks and processes them
├── authService.js         # Singleton authentication service for sites requiring login
├── config/
│   └── worker.config.json # Worker configuration (number of workers, delays, etc.)
├── plugins/
│   ├── zocdoc.js          # Plugin for Zocdoc (viewMore mode)
│   └── carehome.js        # Plugin for Carehome (paginated mode)
└── kubernetes/
    ├── deployment-api.yaml
    ├── deployment-worker.yaml
    ├── service-api.yaml
    ├── configmap.yaml
    └── secret.yaml
```

---

## Prerequisites

- **Node.js** (v14+ recommended)
- **npm** (comes with Node.js)
- **MongoDB:** Running locally (or via Docker) for persistence.
- **Redis:** Running locally (or via Docker) for task queueing.
- **Docker:** To build container images.
- **kubectl & Minikube:** For local Kubernetes deployment (optional, for testing).

For managing Node versions, tools like **nvm** or **Volta** are recommended.

---

## Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/username/my-crawler.git
   cd my-crawler
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Set Up Environment Variables:**  
   Configure  MongoDB and Redis connection details in  Kubernetes secrets or a local configuration file.

---

## Configuration

- **Worker Configuration:**  
  Edit `config/worker.config.json` to adjust parameters like `numWorkers`, `initialDelay`, `maxDelay`, etc.

- **Plugin Configuration:**  
  Plugins can be updated via the `/plugins` API endpoint. Each plugin file includes its own version and extraction logic.

---

## Running Locally

### Starting MongoDB and Redis

- **MongoDB:**  
  If using Docker:
  ```bash
  docker run -d -p 27017:27017 --name mongodb mongo
  ```
- **Redis:**  
  If using Docker:
  ```bash
  docker run -d -p 6379:6379 --name redis redis
  ```

### Running the API Server

Start the API server (which runs `api.js`):

```bash
npm start
```

Test the endpoint:
```bash
curl "http://localhost:8080/reviews/aggregate?sourceUrl=https://www.zocdoc.com/dentist/peggy-yang-dds-507076&sourceName=zocdoc"
```

### Running the Task Processor

In another terminal, start the task processor:
```bash
node taskProcessor.js
```
This service listens to MongoDB for new tasks and pushes them into the Redis queue.

### Running Extraction Workers

Extraction workers poll the Redis queue and process tasks. For testing, run:
```bash
npm run worker
```
Or you can simulate multiple workers in separate terminals.

---

## API Endpoints

### GET /reviews/aggregate
- **Description:** Retrieves aggregated reviews for a given product URL.
- **Query Parameters:**
  - `sourceUrl`: The URL of the product review page.
  - `sourceName`: The plugin name to use.
  - `filterDate` (optional): Only include reviews with a date >= this value.
- **Success Response:**
  ```json
  {
    "review_count": 631,
    "aggregated_reviews": [
      {
        "rating": 5,
        "review_date": "2023-08-17",
        "reviewer_name": "Edward W.",
        "comment": "Extremely positive. Beautiful and clean office. Top of the line equipment and extremely friendly staff."
      }
      // ...
    ],
    "review_aggregated_count": 631,
    "response_code": 200
  }
  ```
- **Failure Response:**
  ```json
  {
    "response_code": 400,
    "error": { "message": "Network Issue" }
  }
  ```

### POST /jobs
- **Description:** Accepts job submissions (via file upload or JSON) to create tasks.
- **Response Example:**
  ```json
  {
    "jobId": "JOB123456",
    "message": "Job submitted successfully",
    "totalTasks": 10
  }
  ```

### POST /plugins
- **Description:** Allows adding or updating plugin configurations.
- **Request Body Example:**
  ```json
  {
    "pluginName": "zocdoc",
    "requiresAuth": false,
    "reviewContainerXPath": "//div[contains(@data-testid, 'review-item')]",
    "commentXPath": ".//p[contains(@data-testid, 'review-comment')]",
    "dateXPath": ".//span[contains(@data-testid, 'review-date')]",
    "reviewerXPath": ".//span[contains(@data-testid, 'reviewer-name')]",
    "ratingXPath": ".//span[contains(@data-testid, 'review-rating')]",
    "paginationMode": "viewMore",
    "viewMoreXPath": "//button[contains(text(),'View More')]"
  }
  ```

---

## Plugins

### Plugin Interface

The base plugin (in `baseReviewPlugin.js`) defines methods that every plugin must implement:
- `extractReviews(page)`
- `normalizeDate(rawDateStr)`
- `extractGlobalStats(page)`
- `hasMoreReviews(page)`
- `clickLoadMore(page)` / `simulateScroll(page)` / `getNextPageUrl(page)`
- `applyFilter(page, filter)`

### Example Plugins

- **Zocdoc Plugin (`plugins/zocdoc.js`):** Uses a "viewMore" approach.
- **Carehome Plugin (`plugins/carehome.js`):** Uses paginated navigation and extracts additional metadata.

---

## Kubernetes Deployment

The `kubernetes/` directory contains manifests to deploy the system on Kubernetes.

- **deployment-api.yaml:** Deploys the API server.
- **deployment-worker.yaml:** Deploys extraction workers (scalable).
- **service-api.yaml:** Exposes the API server via a LoadBalancer.
- **configmap.yaml:** Contains worker configuration.
- **secret.yaml:** Contains sensitive information (e.g., MongoDB URI).

### To Deploy Locally with Minikube:
1. Start Minikube:
   ```bash
   minikube start --driver=docker
   ```
2. Build and load  Docker image:
   ```bash
   docker build -t my-crawler:latest .
   minikube image load my-crawler:latest
   ```
3. Apply Kubernetes manifests:
   ```bash
   kubectl apply -f kubernetes/configmap.yaml
   kubectl apply -f kubernetes/secret.yaml
   kubectl apply -f kubernetes/deployment-api.yaml
   kubectl apply -f kubernetes/service-api.yaml
   kubectl apply -f kubernetes/deployment-worker.yaml
   ```

---

## Scaling & Autoscaling

Extraction workers are deployed as a separate Deployment. You can configure Horizontal Pod Autoscaling (HPA) to scale workers based on CPU usage or a custom metric (such as Redis queue length). For example, see `kubernetes/hpa-worker.yaml` for an HPA manifest.

---

## Auth Service

For websites that require authentication, the extraction worker calls the shared auth service (implemented in `authService.js`). This service caches session headers (cookies) so that workers don’t log in repeatedly. If a 403 or rate-limit error occurs, the worker calls `refreshSession()` to renew the session.

---

## Future Enhancements

- **Robust Queue:**  
  Replace the in-memory Redis queue with a more robust message broker (e.g., RabbitMQ or a dedicated Redis-backed queue like Bull).

- **Advanced Autoscaling:**  
  Integrate custom metrics to scale extraction workers dynamically.

- **Dashboard:**  
  Build a dashboard that consumes job metadata from MongoDB and displays progress, review counts, and plugin health.

- **Plugin Versioning & Health Checks:**  
  Implement health checks and versioning for plugins to detect when a website’s DOM changes.

---

## Contributing

Contributions are welcome! Please submit pull requests or open issues for improvements and bug fixes.

---

## Contact

For any questions or issues, please open an issue in the repository or contact the maintainer at [mustafa.mohamed@live.com].

---