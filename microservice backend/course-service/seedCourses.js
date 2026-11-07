import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Course from "./src/models/Course.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const run = async () => {
  const uri = process.env.COURSE_MONGO_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/course_db";
  console.log("Connecting to Mongo...");
  const conn = await mongoose.connect(uri, {
    dbName: process.env.COURSE_DB_NAME || "course_db",
    serverSelectionTimeoutMS: 8000,
  });
  console.log("Connected to Mongo:", conn.connection.name);

  const existing = await Course.find({}, "title topics");
  console.log(`Current courses in DB: ${existing.length}`);
  existing.forEach((c) => {
    console.log(`- [${c._id}] ${c.title} (${(c.topics || []).length} topics)`);
  });

  const coursesToSeed = [
    {
      title: "Mastering Distributed Systems & Microservices",
      description: "Comprehensive engineering guide to event-driven architectures, sharded databases, saga patterns, Kafka event streams, and fault-tolerant service meshes.",
      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80",
      topics: [
        {
          title: "Architecture & Service Boundaries",
          order: 1,
          subtopics: [
            {
              title: "Domain-Driven Design (DDD) & Service Boundaries",
              order: 1,
              body: `Distributed systems require careful decoupling of concerns. In this lesson, we explore how to establish clear bounded contexts.\n\nKey Concepts:\n1. Bounded Context: Independent boundaries enclosing domain logic.\n2. Aggregate Roots: Entities responsible for maintaining transactional consistency.\n3. API Gateways: Single entry point handling rate limiting, auth translation, and reverse proxy routing.`,
              codeBlocks: [
                {
                  language: "javascript",
                  code: `// Express API Gateway Reverse Proxy Sample
import { createProxyMiddleware } from 'http-proxy-middleware';

export const configureGateway = (app) => {
  app.use('/api/orders', createProxyMiddleware({
    target: process.env.ORDER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/orders': '' }
  }));
};`
                }
              ]
            },
            {
              title: "Saga Pattern: Choreography vs Orchestration",
              order: 2,
              body: `Distributed transactions cannot rely on 2-Phase Commit (2PC) across network partitions without sacrificing availability.\n\nComparison:\n• Choreography: Services emit events and react asynchronously without a central coordinator.\n• Orchestration: A central saga coordinator manages the execution flow and dispatches compensating transactions on failure.`,
              codeBlocks: [
                {
                  language: "javascript",
                  code: `// Orchestration Saga Step Definition
class OrderSaga {
  constructor(orderId, paymentClient, inventoryClient) {
    this.orderId = orderId;
    this.paymentClient = paymentClient;
    this.inventoryClient = inventoryClient;
  }

  async execute() {
    try {
      await this.paymentClient.reserveFunds(this.orderId);
      await this.inventoryClient.allocateStock(this.orderId);
    } catch (err) {
      console.error("Saga step failed, initiating rollback:", err.message);
      await this.paymentClient.refundPayment(this.orderId);
      throw err;
    }
  }
}`
                }
              ]
            }
          ]
        },
        {
          title: "Resilience & Consensus",
          order: 2,
          subtopics: [
            {
              title: "Circuit Breakers & Exponential Backoff",
              order: 1,
              body: `Preventing cascading failures across services using circuit breaking mechanisms and jittered retry strategies.\n\nCircuit States:\n1. Closed: Normal operation, requests pass through.\n2. Open: High failure threshold reached, incoming requests fail fast immediately.\n3. Half-Open: Controlled test requests to check if downstream service recovered.`,
              codeBlocks: [
                {
                  language: "javascript",
                  code: `// Exponential Backoff with Jitter
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function retryWithBackoff(fn, retries = 3, baseDelay = 300) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries - 1) throw err;
      const delay = Math.pow(2, attempt) * baseDelay + Math.random() * 100;
      console.warn(\`Attempt \${attempt + 1} failed. Retrying in \${Math.round(delay)}ms...\`);
      await sleep(delay);
    }
  }
}`
                }
              ]
            }
          ]
        }
      ]
    },
    {
      title: "Full-Stack React & Next.js Performance Optimization",
      description: "Deep dive into React 19 Server Components, streaming SSR, bundle code-splitting, Web Vitals optimization, and state management at scale.",
      image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80",
      topics: [
        {
          title: "React Server Components (RSC) & Streaming",
          order: 1,
          subtopics: [
            {
              title: "Mental Model of Server Components",
              order: 1,
              body: `React Server Components execute entirely on the server and stream serialized UI trees to the client without shipping runtime JavaScript dependencies.\n\nKey Advantages:\n• Zero-bundle-size dependencies.\n• Direct database access without intermediate HTTP REST layer.\n• Automatic code-splitting for child client components.`,
              codeBlocks: [
                {
                  language: "javascript",
                  code: `// Next.js Server Component Example
import prisma from '@/lib/prisma';

export default async function UserProfile({ params }) {
  // Directly query database on server - zero bundle impact!
  const user = await prisma.user.findUnique({
    where: { id: params.id }
  });

  return (
    <div className="profile-container">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}`
                }
              ]
            },
            {
              title: "Streaming SSR with Suspense Boundaries",
              order: 2,
              body: `Break page rendering into asynchronous chunks. Instead of waiting for all data to resolve before returning HTML, stream fast shells immediately while slow data queries stream in later.`,
              codeBlocks: [
                {
                  language: "javascript",
                  code: `import { Suspense } from 'react';
import PostsFeed from './PostsFeed';
import SkeletonLoader from './SkeletonLoader';

export default function FeedPage() {
  return (
    <main>
      <h1>Recent Platform Activity</h1>
      <Suspense fallback={<SkeletonLoader />}>
        <PostsFeed />
      </Suspense>
    </main>
  );
}`
                }
              ]
            }
          ]
        },
        {
          title: "Core Web Vitals & Hydration Optimization",
          order: 2,
          subtopics: [
            {
              title: "INP (Interaction to Next Paint) & Profiling",
              order: 1,
              body: `Interaction to Next Paint assesses responsiveness by measuring the latency of all user interactions (clicks, keyboard input, taps) during the entire page lifecycle.`,
              codeBlocks: [
                {
                  language: "javascript",
                  code: `// Measuring Long Tasks with PerformanceObserver
if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 50) {
        console.warn('Long Task detected:', entry.duration, 'ms');
      }
    }
  });
  observer.observe({ type: 'longtask', buffered: true });
}`
                }
              ]
            }
          ]
        }
      ]
    },
    {
      title: "Data Structures & Algorithmic Problem Solving",
      description: "Master foundational and advanced algorithms: Dynamic Programming, Graph Traversals, Trie trees, Fenwick Trees, and competitive programming patterns.",
      image: "https://images.unsplash.com/photo-1516116211227-bbc14bd59124?w=800&auto=format&fit=crop&q=80",
      topics: [
        {
          title: "Graph Theory & Pathfinding",
          order: 1,
          subtopics: [
            {
              title: "Dijkstra's Algorithm with Priority Queue",
              order: 1,
              body: `Dijkstra's algorithm determines the shortest paths between nodes in a graph with non-negative edge weights.\n\nTime Complexity: O((V + E) log V) with a Min-Heap/Priority Queue.`,
              codeBlocks: [
                {
                  language: "javascript",
                  code: `// Dijkstra's Shortest Path Implementation
class PriorityQueue {
  constructor() {
    this.values = [];
  }
  enqueue(val, priority) {
    this.values.push({ val, priority });
    this.sort();
  }
  dequeue() {
    return this.values.shift();
  }
  sort() {
    this.values.sort((a, b) => a.priority - b.priority);
  }
}

function dijkstra(graph, start) {
  const distances = {};
  const pq = new PriorityQueue();

  for (let vertex in graph) {
    distances[vertex] = vertex === start ? 0 : Infinity;
  }
  pq.enqueue(start, 0);

  while (pq.values.length > 0) {
    const { val: current, priority: dist } = pq.dequeue();
    for (let neighbor in graph[current]) {
      const alt = dist + graph[current][neighbor];
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        pq.enqueue(neighbor, alt);
      }
    }
  }
  return distances;
}`
                }
              ]
            }
          ]
        },
        {
          title: "Dynamic Programming Techniques",
          order: 2,
          subtopics: [
            {
              title: "0/1 Knapsack Problem & Space Optimization",
              order: 1,
              body: `The 0/1 Knapsack Problem is a classic algorithmic challenge in combinatorial optimization.\n\nOptimization:\nInstead of a 2D matrix (O(N * W) space), we can optimize space to O(W) using a single 1D array traversed backwards.`,
              codeBlocks: [
                {
                  language: "javascript",
                  code: `function knapsack(weights, values, capacity) {
  const dp = new Array(capacity + 1).fill(0);

  for (let i = 0; i < weights.length; i++) {
    for (let w = capacity; w >= weights[i]; w--) {
      dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]);
    }
  }
  return dp[capacity];
}`
                }
              ]
            }
          ]
        }
      ]
    }
  ];

  for (const cData of coursesToSeed) {
    const exists = await Course.findOne({ title: cData.title });
    if (!exists) {
      const created = await Course.create(cData);
      console.log(`Created new course: "${created.title}" with ID ${created._id}`);
    } else {
      console.log(`Course "${cData.title}" already exists, updating topics...`);
      exists.description = cData.description;
      exists.image = cData.image;
      if (!exists.topics || exists.topics.length === 0) {
        exists.topics = cData.topics;
      }
      await exists.save();
    }
  }

  const countAfter = await Course.countDocuments();
  console.log(`Total courses in DB now: ${countAfter}`);
  await mongoose.disconnect();
  console.log("Disconnected successfully.");
};

run().catch((err) => {
  console.error("Seed script error:", err);
  process.exit(1);
});

