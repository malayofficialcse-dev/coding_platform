import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const MONGO_URI =
  process.env.POST_MONGO_URI ||
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/post_db";

const PROFESSIONAL_POST_TEMPLATES = [
  {
    type: "code",
    group: "JavaScript Hub",
    tags: ["react", "performance", "frontend", "javascript"],
    text: "🚀 **Optimizing Large React Component Trees with Concurrent Transitions**\n\nWhen handling rapid user keystrokes in data-heavy tables, synchronous updates easily freeze the main thread. Here is how we separate urgent state updates (text input) from non-urgent filter transitions using `startTransition`:\n\nThis eliminated UI stuttering completely and boosted our Lighthouse interaction score to 98.",
    codeBlocks: [
      {
        language: "javascript",
        code: `import React, { useState, useTransition, useMemo } from 'react';

export function CampusProblemFilter({ allProblems, onSelect }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredList, setFilteredList] = useState(allProblems);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (e) => {
    const query = e.target.value;
    // 1. Urgent update: keep input typing responsive
    setSearchTerm(query);

    // 2. Non-urgent update: deferred rendering for heavy list
    startTransition(() => {
      const filtered = allProblems.filter((p) =>
        p.title.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredList(filtered);
    });
  };

  return (
    <div className="filter-container">
      <input value={searchTerm} onChange={handleSearch} placeholder="Filter problems..." />
      {isPending && <span className="spinner">Optimizing render...</span>}
      <ul>
        {filteredList.map((item) => (
          <li key={item.id} onClick={() => onSelect(item)}>{item.title}</li>
        ))}
      </ul>
    </div>
  );
}`,
      },
    ],
    comments: [
      "Spot on! `startTransition` is significantly better than raw debounce when you want immediate user keystroke feedback without dropping frames.",
      "Are you also pairing this with `useDeferredValue` for child components or keeping it strictly in the event handler?",
      "We tested this on a 5000-row telemetry viewer. Profiling showed scripted time dropped from 180ms to under 16ms. Solid write-up!",
    ],
  },
  {
    type: "code",
    group: "Algorithms & DS",
    tags: ["algorithms", "dsa", "python", "leetcode"],
    text: "💡 **Sliding Window Maximum in O(N) using Monotonic Deque**\n\nA classic mistake in sliding window problems is using a Max-Heap which incurs `O(N log K)`. By maintaining a monotonic decreasing deque storing indices, each element is pushed and popped at most once, giving true `O(N)` linear runtime.\n\nHere is the clean Python implementation with boundary handling:",
    codeBlocks: [
      {
        language: "python",
        code: `from collections import deque

def max_sliding_window(nums: list[int], k: int) -> list[int]:
    """
    Computes maximum value in every window of size k in O(N) time and O(K) space.
    """
    if not nums or k == 0:
        return []
    
    dq = deque()  # stores indices in decreasing order of their values
    result = []
    
    for i, val in enumerate(nums):
        # 1. Pop elements out of current window [i - k + 1, i]
        while dq and dq[0] < i - k + 1:
            dq.popleft()
            
        # 2. Maintain monotonic decreasing property
        while dq and nums[dq[-1]] < val:
            dq.pop()
            
        dq.append(i)
        
        # 3. Add to result once initial window size is reached
        if i >= k - 1:
            result.append(nums[dq[0]])
            
    return result`,
      },
    ],
    comments: [
      "The monotonic deque pattern is also the exact same foundation used for next greater element and stock span problems. Great explanation!",
      "Clean implementation! The comment explaining why `dq[0] < i - k + 1` is removed makes the window boundary crystal clear.",
      "Just solved a similar hard problem on Code Campus yesterday using this exact approach. Appreciate the refresher!",
    ],
  },
  {
    type: "code",
    group: "General Feed",
    tags: ["database", "postgresql", "indexing", "backend"],
    text: "🔥 **PostgreSQL Indexing: Why Partial and Composite Indexes Matter**\n\nIn high-volume applications, indexing entire tables blindly degrades write throughput. Using partial indexes (`WHERE active = true` or `WHERE deleted_at IS NULL`) saves disk space and fits hot data completely into the RAM buffer pool.\n\nCheck out this query optimization benchmark:",
    codeBlocks: [
      {
        language: "sql",
        code: `-- Avoid full index on 10 million archived rows
-- Create partial index specifically for active submissions
CREATE INDEX CONCURRENTLY idx_submissions_active_user 
ON coding_submissions (user_id, created_at DESC) 
WHERE status = 'pending';

-- Explain analyze before: Sequential Scan cost=0.00..284120.00 (time=145.2ms)
-- Explain analyze after: Index Scan cost=0.43..12.50 (time=0.38ms)
EXPLAIN ANALYZE
SELECT id, problem_id, created_at 
FROM coding_submissions 
WHERE user_id = '907e479d-3b23-4b86-bc49-d81d67aa3156'
  AND status = 'pending'
ORDER BY created_at DESC;`,
      },
    ],
    comments: [
      "Partial indexes are such an underrated superpower in Postgres. We shaved 14GB of index cache memory using `WHERE deleted_at IS NULL`.",
      "Always remember `CREATE INDEX CONCURRENTLY` in production so you don't take a table-level exclusive lock during migration!",
      "Bookmarked for our upcoming database tuning sprint. Thanks for including the EXPLAIN ANALYZE before/after stats.",
    ],
  },
  {
    type: "poll",
    group: "General Feed",
    tags: ["architecture", "state-management", "poll", "frontend"],
    text: "📊 **Campus Architecture Poll: What is your primary client-side state strategy for 2026?**\n\nWith React 19 and modern server components, client state paradigms have shifted drastically. Where is your team placing most complex application state?",
    poll: {
      question: "Which client state management solution do you rely on most?",
      options: [
        { text: "Zustand (minimal boilerplate & hooks)" },
        { text: "TanStack Query (server state & caching)" },
        { text: "Redux Toolkit / RTK Query" },
        { text: "Native Context + useReducer / Signals" },
      ],
    },
    comments: [
      "TanStack Query for 90% of server state + Zustand for local modals and transient UI is the sweet spot right now.",
      "Voted Zustand! Cleanest developer experience by far, especially when bridging canvas/WebGL state outside React render loops.",
      "RTK is still unmatched for huge enterprise apps with complex state serialization and undo/redo history trees.",
    ],
  },
  {
    type: "question",
    group: "General Feed",
    tags: ["systemdesign", "microservices", "architecture", "distributed-systems"],
    text: "❓ **System Design Question: Saga Orchestrator vs Choreography for Microservice Transactions**\n\nWhen handling a distributed transaction like user enrollment -> payment verification -> notification dispatch -> analytics aggregation:\n\n- When do you prefer an **Orchestrator** (central coordinator tracking states) versus **Choreography** (event pub/sub via Kafka/RabbitMQ)?\n\nIn our benchmarks, orchestration makes compensation rollbacks much easier to audit, but creates a single point of coordinator logic. How is your team handling this trade-off?",
    comments: [
      "Orchestration with Temporal or a dedicated state machine is a lifesaver once you have more than 4 service steps. Event choreography becomes spaghetti to debug during partial failures.",
      "We use choreography for independent side-effects (like analytics/audit logs), but strict orchestration for financial/enrollment states where rollbacks must be strictly atomic.",
      "Great question. Outbox pattern + idempotency keys on every consumer step is mandatory regardless of which pattern you pick.",
      "Agreed with the Outbox pattern. Without it, dual-write failures between your DB and message broker will eventually corrupt state.",
    ],
  },
  {
    type: "text",
    group: "General Feed",
    tags: ["cleancode", "career", "engineering", "mentorship"],
    text: "🌟 **5 Principles for Writing Maintainable Production Software**\n\n1. **Colocate code by feature, not technical role:** Grouping components, hooks, tests, and API clients by domain makes refactoring 10x faster than traditional split directories.\n2. **Design for failure:** Assume external APIs, network requests, and DB queries will timeout. Set strict timeouts and sensible fallbacks.\n3. **Make invalid state unrepresentable:** Use strict TypeScript union types and database check constraints instead of relying on runtime if-checks everywhere.\n4. **Keep logs structured & actionable:** A log entry without request tracing or context is just noise during an incident.\n5. **Write tests that verify behavior, not implementation details.**",
    comments: [
      "Point #3 ('Make invalid state unrepresentable') is the best advice anyone gave me as a junior engineer. Eliminates whole classes of bugs.",
      "Feature-based folders transformed our 40-engineer monorepo. Onboarding new teammates takes half the time now.",
      "Super insightful post! Point #4 on structured logging saved us during last month's database latency spike.",
    ],
  },
  {
    type: "code",
    group: "Python Learners",
    tags: ["python", "fastapi", "asyncio", "performance"],
    text: "⚡ **Mastering Async Concurrency in Python with `asyncio.gather` and Semaphores**\n\nWhen fetching data from dozens of external microservices or running batch code evaluations, firing hundreds of tasks concurrently can exhaust socket pools. Wrapping your calls in an `asyncio.Semaphore` provides elegant rate-limiting:",
    codeBlocks: [
      {
        language: "python",
        code: `import asyncio
import httpx

async def fetch_service_health(client: httpx.AsyncClient, semaphore: asyncio.Semaphore, url: str) -> dict:
    async with semaphore:  # limits concurrent connections to prevent pool exhaustion
        try:
            response = await client.get(url, timeout=5.0)
            return {"url": url, "status": response.status_code, "data": response.json()}
        except Exception as e:
            return {"url": url, "status": 500, "error": str(e)}

async def monitor_all_services(urls: list[str]):
    semaphore = asyncio.Semaphore(10)  # max 10 concurrent requests
    async with httpx.AsyncClient() as client:
        tasks = [fetch_service_health(client, semaphore, url) for url in urls]
        results = await asyncio.gather(*tasks)
        return results`,
      },
    ],
    comments: [
      "Semaphores with `async with` are so clean in Python. Prevents HTTP connection pool timeouts under high load.",
      "Make sure to also use HTTP/2 on the `AsyncClient` if your upstream microservices support it to multiplex multiple requests over one TCP stream!",
      "Bookmarked! Exactly what I needed for our campus microservice health monitor.",
    ],
  },
  {
    type: "question",
    group: "Web Dev Bootcamp",
    tags: ["webdev", "css", "ui", "javascript"],
    text: "❓ **CSS Container Queries vs Traditional Media Queries: Is it time to switch?**\n\nNow that container queries (`@container`) have full baseline browser support across Chrome, Safari, and Firefox, are you structuring reusable component libraries around container queries instead of viewport `@media`?\n\nIt makes components truly autonomous when embedded in sidebars, cards, and full-screen layouts.",
    comments: [
      "Container queries are an absolute game changer for widget design. A widget can adapt whether it sits in a 300px sidebar or full-width grid effortlessly.",
      "We converted our feed cards to `@container (min-width: 450px)` last month. Completely eliminated responsive breakpoint hacks!",
      "The only caveat is remembering to define `container-type: inline-size` on the parent container. Once you do that, it's magical.",
    ],
  },
];

async function seedProfessionalPosts() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI, { dbName: process.env.POST_DB_NAME || "post_db" });
  console.log("Connected to MongoDB.");

  // Fetch all users
  const users = await User.find({}).lean();
  if (users.length === 0) {
    console.error("No users found in post_db.users! Run sync first.");
    return;
  }
  console.log(`Found ${users.length} users in post-service.`);

  // Pick diverse active users to author posts
  const primaryUsers = users.slice(0, Math.min(users.length, 30));
  const reactionTypes = ["like", "fire", "insight", "rocket", "clap"];

  let totalPostsCreated = 0;
  let totalCommentsCreated = 0;

  for (let i = 0; i < primaryUsers.length; i++) {
    const author = primaryUsers[i];
    const authorId = String(author._id);

    // Pick 1 to 2 templates for this author
    const templateIdx1 = (i * 2) % PROFESSIONAL_POST_TEMPLATES.length;
    const templateIdx2 = (i * 2 + 1) % PROFESSIONAL_POST_TEMPLATES.length;
    const selectedTemplates = [PROFESSIONAL_POST_TEMPLATES[templateIdx1]];
    if (i % 2 === 0) {
      selectedTemplates.push(PROFESSIONAL_POST_TEMPLATES[templateIdx2]);
    }

    for (const tpl of selectedTemplates) {
      // Create Post
      const postTimestamp = new Date(Date.now() - Math.floor(Math.random() * 86400000 * 5) - 3600000);

      // Add realistic reactions from other users
      const otherUsers = users.filter((u) => String(u._id) !== authorId);
      const postReactions = [];
      const numReactions = Math.min(otherUsers.length, 3 + Math.floor(Math.random() * 6));
      const shuffledOthers = [...otherUsers].sort(() => 0.5 - Math.random());

      for (let r = 0; r < numReactions; r++) {
        postReactions.push({
          user: String(shuffledOthers[r]._id),
          type: reactionTypes[r % reactionTypes.length],
        });
      }

      // Prepare poll if applicable
      let pollData = null;
      if (tpl.type === "poll" && tpl.poll) {
        pollData = {
          question: tpl.poll.question,
          options: tpl.poll.options.map((opt, optIdx) => {
            // Assign some votes from other users
            const voters = shuffledOthers
              .slice(optIdx * 2, optIdx * 2 + 2)
              .map((u) => String(u._id));
            return {
              text: opt.text,
              votes: voters,
            };
          }),
        };
      }

      const post = new Post({
        author: authorId,
        group: tpl.group || "General Feed",
        text: tpl.text,
        codeBlocks: tpl.codeBlocks || [],
        images: [],
        likes: postReactions.filter((r) => r.type === "like").map((r) => r.user),
        reactions: postReactions,
        tags: tpl.tags || ["coding", "tech"],
        postType: tpl.type || "text",
        poll: pollData,
        comments: [],
        createdAt: postTimestamp,
        updatedAt: postTimestamp,
      });

      await post.save();
      totalPostsCreated++;

      // Create professional comments from 2-4 peers
      const commentCount = Math.min(tpl.comments.length, Math.min(shuffledOthers.length, 3));
      const commentIds = [];

      for (let c = 0; c < commentCount; c++) {
        const commenter = shuffledOthers[c];
        const commentTime = new Date(postTimestamp.getTime() + (c + 1) * (15 * 60 * 1000) + Math.random() * 300000);

        const comment = new Comment({
          author: String(commenter._id),
          post: post._id,
          text: tpl.comments[c] || "Great insight, thanks for sharing!",
          createdAt: commentTime,
          updatedAt: commentTime,
        });

        await comment.save();
        commentIds.push(comment._id);
        totalCommentsCreated++;
      }

      // Link comments back to post
      post.comments = commentIds;
      await post.save();
    }
  }

  console.log(`\n🎉 Successfully created:`);
  console.log(`   - ${totalPostsCreated} professional tech posts with code snippets, polls, and reactions`);
  console.log(`   - ${totalCommentsCreated} professional comments linked with full user avatars`);
}

seedProfessionalPosts()
  .then(() => {
    console.log("Seeding complete!");
    mongoose.disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seeding failed:", err);
    mongoose.disconnect();
    process.exit(1);
  });
