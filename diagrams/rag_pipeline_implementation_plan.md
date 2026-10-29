# 🧠 Code Campus AI — RAG Pipeline Implementation Plan
### Senior RAG Pipeline & AI Engineering Architecture

---

## 📋 Executive Summary

You are building an **AI-powered educational chatbot** on top of **Code Campus** — a microservices-based learning platform with:
- **Courses** (MongoDB — topics, subtopics, code blocks)
- **DSA Problems** (MongoDB — 170+ problems, editorials, hints, boilerplate)
- **Exams/MCQs** (PostgreSQL — 10 assessments, 300 questions)
- **User Progress** (PostgreSQL — submissions, scores, enrollments)
- **Social Graph** (Neo4j — followers, mentors)
- **Real-time Chat** (MongoDB + Socket.IO)

The goal is to deploy a **context-aware AI tutor chatbot** that:
- Answers questions about course content
- Explains DSA problems and hints
- Helps with code debugging
- Gives personalized learning suggestions based on user progress

---

## 🏗️ Architecture Overview

![RAG Pipeline Architecture](C:\Users\INDIA\.gemini\antigravity-ide\brain\d32009e0-fc20-4004-a770-89be492f78fe\rag_architecture_overview_1793285812476.jpg)

---

## 🗂️ System Architecture Breakdown

```mermaid
flowchart TD
    subgraph CLIENT["🖥️ Client Layer (React + Vite :5173)"]
        UI[Chat Widget Component]
        SOCKET[Socket.IO Client]
    end

    subgraph GATEWAY["🔀 API Gateway (:5000)"]
        GW[Express API Gateway]
        AUTH[JWT Middleware]
    end

    subgraph AI_SVC["🤖 AI Service (:5011) — NEW Python FastAPI"]
        LANGGRAPH[LangGraph Agent Orchestrator]
        RAG[RAG Chain - LangChain]
        TOOLS[Tool Router]
        MEMORY[Conversation Memory]
        SMITH[LangSmith Tracer]
    end

    subgraph VECTOR["🔍 Vector Store"]
        CHROMA[(ChromaDB\nLocal Dev)]
        PINECONE[(Pinecone\nProduction)]
    end

    subgraph EMBED["⚡ Embedding Layer"]
        EMB[text-embedding-3-small\nOpenAI API]
    end

    subgraph INGESTION["📥 Ingestion Pipeline (Offline)"]
        LOADER[Document Loaders]
        SPLITTER[Text Splitters\nRecursiveCharacterTextSplitter]
        EMBEDDER[Batch Embedder]
    end

    subgraph DATASOURCES["🗄️ Existing Data Sources"]
        MONGO_COURSE[(MongoDB\ncourse_db)]
        MONGO_CODING[(MongoDB\ncoding_problems_db)]
        POSTGRES_EXAM[(PostgreSQL\nexam_db)]
        POSTGRES_USER[(PostgreSQL\nuser_db + enrollment)]
        NEO4J[(Neo4j\nSocial Graph)]
    end

    subgraph LLM["🧠 LLM Provider"]
        GPT4O[GPT-4o / GPT-4o-mini]
        GEMINI[Gemini 1.5 Pro]
    end

    UI -->|REST / WS| GATEWAY
    GATEWAY -->|Proxy /api/ai/*| AI_SVC
    AI_SVC --> LANGGRAPH
    LANGGRAPH --> TOOLS
    TOOLS -->|Semantic Search| RAG
    RAG --> VECTOR
    RAG --> LLM
    LANGGRAPH --> MEMORY
    LANGGRAPH --> SMITH

    DATASOURCES --> LOADER
    LOADER --> SPLITTER
    SPLITTER --> EMBEDDER
    EMBEDDER --> EMB
    EMB --> VECTOR
```

---

## 📦 Where to Implement the AI Service

> [!IMPORTANT]
> **Create a NEW Python microservice** called `ai-service` at port **5011** inside your existing `microservice backend/` directory. This integrates seamlessly with your existing API Gateway.

### Why a Separate Python Service?
| Reason | Explanation |
|--------|-------------|
| **Ecosystem** | LangChain, LangGraph, LangSmith — all Python-native |
| **Performance** | Async FastAPI handles streaming LLM responses |
| **Isolation** | No Node.js dependency conflicts |
| **Scalability** | Can be independently scaled via Docker/K8s |
| **Already done** | Your gateway already routes to port 5011 pattern |

### File Path
```
microservice backend/
├── ai-service/                 ← NEW service
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env
│   └── src/
│       ├── main.py             ← FastAPI entry point
│       ├── config/
│       │   └── settings.py
│       ├── ingestion/
│       │   ├── loaders.py      ← MongoDB/Postgres loaders
│       │   ├── splitter.py     ← Text chunking
│       │   └── embedder.py     ← Vector store builder
│       ├── rag/
│       │   ├── chain.py        ← RAG retrieval chain
│       │   ├── prompts.py      ← System prompts
│       │   └── retriever.py    ← Vector retriever
│       ├── agents/
│       │   ├── graph.py        ← LangGraph state machine
│       │   ├── tools.py        ← Agent tools
│       │   └── memory.py       ← Conversation memory
│       └── api/
│           └── routes.py       ← REST + SSE endpoints
```

---

## 🚀 Step-by-Step Implementation Plan

---

### PHASE 1 — Data Ingestion Pipeline
> **Goal**: Extract all platform content → chunk → embed → store in vector DB

#### Step 1.1 — Document Loaders

```python
# src/ingestion/loaders.py
from pymongo import MongoClient
from langchain.schema import Document

class CourseLoader:
    """Loads course content from MongoDB course_db"""
    def load(self) -> list[Document]:
        client = MongoClient(COURSE_MONGO_URI)
        courses = client.course_db.courses.find({})
        docs = []
        for course in courses:
            for topic in course.get("topics", []):
                for subtopic in topic.get("subtopics", []):
                    # Build rich text chunk
                    content = f"""
                    Course: {course['title']}
                    Topic: {topic['title']}
                    Subtopic: {subtopic['title']}
                    
                    {subtopic.get('body', '')}
                    
                    Code Examples:
                    {self._format_code_blocks(subtopic.get('codeBlocks', []))}
                    """
                    docs.append(Document(
                        page_content=content,
                        metadata={
                            "source": "course",
                            "course_id": str(course["_id"]),
                            "course_title": course["title"],
                            "topic": topic["title"],
                            "subtopic": subtopic["title"],
                        }
                    ))
        return docs

class CodingProblemLoader:
    """Loads DSA problems from MongoDB coding_problems_db"""
    def load(self) -> list[Document]:
        # Loads: title, description, difficulty, dsaTopic,
        # editorial, hints, constraints, boilerplate
        ...

class ExamLoader:
    """Loads MCQ questions from PostgreSQL exam_db"""
    def load(self) -> list[Document]:
        # Loads exam questions + options + correct answers
        ...
```

#### Step 1.2 — Text Splitting Strategy

```python
# src/ingestion/splitter.py
from langchain.text_splitter import RecursiveCharacterTextSplitter

# For course content (rich text)
course_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", ".", " "]
)

# For DSA problems (keep editorial intact)
problem_splitter = RecursiveCharacterTextSplitter(
    chunk_size=2000,   # Larger for problem+editorial
    chunk_overlap=400,
    separators=["\n\n", "\n"]
)

# For MCQ exam questions
exam_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,    # Small - each Q is self-contained
    chunk_overlap=50
)
```

#### Step 1.3 — Embedding + Vector Store

```python
# src/ingestion/embedder.py
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma  # Dev
# from langchain_pinecone import PineconeVectorStore  # Prod

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

def build_vector_store(documents: list[Document]):
    vectorstore = Chroma.from_documents(
        documents=documents,
        embedding=embeddings,
        persist_directory="./chroma_db",
        collection_name="code_campus_knowledge"
    )
    return vectorstore
```

> [!TIP]
> Run ingestion as a **one-time offline script** and re-run whenever course content is updated. Later, hook into MongoDB Change Streams for real-time sync.

---

### PHASE 2 — RAG Chain with LangChain
> **Goal**: Build the retrieval-augmented generation chain

#### Step 2.1 — Retriever Setup

```python
# src/rag/retriever.py
from langchain_chroma import Chroma
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever

# Semantic Search (dense)
semantic_retriever = vectorstore.as_retriever(
    search_type="mmr",        # Maximal Marginal Relevance — diversity
    search_kwargs={
        "k": 6,               # Top 6 chunks
        "fetch_k": 20,        # Fetch 20, re-rank to 6
        "lambda_mult": 0.7    # 0=max diversity, 1=max relevance
    }
)

# Keyword Search (sparse) — BM25
bm25_retriever = BM25Retriever.from_documents(all_docs, k=4)

# Hybrid Retriever (best of both)
hybrid_retriever = EnsembleRetriever(
    retrievers=[semantic_retriever, bm25_retriever],
    weights=[0.7, 0.3]  # 70% semantic, 30% keyword
)
```

#### Step 2.2 — System Prompts

```python
# src/rag/prompts.py

SYSTEM_PROMPT = """You are CodeBot — the AI tutor for Code Campus,
a professional coding education platform.

You have access to:
- Course content (DevOps, Data Analysis, Web Dev, etc.)
- 170+ DSA problems with editorials and hints
- Exam questions and explanations
- User's personal learning progress

Guidelines:
- Be concise, friendly, and technically accurate
- When explaining code, always include examples
- For DSA problems, guide with hints first — don't give full solutions immediately
- Reference specific course modules when relevant
- If asked about the user's progress, use the context provided
- Always respond in the same language the user uses

Context from knowledge base:
{context}

Conversation History:
{chat_history}

Current Question: {question}

Answer:"""
```

#### Step 2.3 — RAG Chain

```python
# src/rag/chain.py
from langchain_openai import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferWindowMemory
from langsmith import traceable

llm = ChatOpenAI(
    model="gpt-4o-mini",    # Cost-efficient for most queries
    temperature=0.1,          # Low temp for factual accuracy
    streaming=True            # Enable streaming responses
)

@traceable(name="rag-chain", project_name="code-campus-ai")
def create_rag_chain(session_id: str):
    memory = ConversationBufferWindowMemory(
        k=10,                    # Last 10 turns
        memory_key="chat_history",
        return_messages=True,
        output_key="answer"
    )
    
    chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=hybrid_retriever,
        memory=memory,
        return_source_documents=True,
        verbose=True,
        combine_docs_chain_kwargs={"prompt": PROMPT_TEMPLATE}
    )
    return chain
```

---

### PHASE 3 — LangGraph Agent Orchestrator
> **Goal**: Route user intent to the right tool/chain using a stateful agent graph

#### Step 3.1 — Agent State

```python
# src/agents/graph.py
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated
import operator

class AgentState(TypedDict):
    messages: Annotated[list, operator.add]
    user_id: str
    intent: str           # "course_question" | "dsa_help" | "debug_code" | ...
    retrieved_context: str
    final_answer: str
    sources: list[dict]
    session_id: str
```

#### Step 3.2 — Agent Nodes (Tools)

```python
# src/agents/tools.py

TOOLS = [
    {
        "name": "search_course_content",
        "description": "Search course materials: DevOps, Data Analysis, Web Dev topics",
        "function": search_course_content
    },
    {
        "name": "search_dsa_problems",
        "description": "Find DSA problems, hints, and editorial explanations",
        "function": search_dsa_problems
    },
    {
        "name": "get_user_progress",
        "description": "Get user's solved problems, exam scores, enrolled courses",
        "function": get_user_progress   # Calls user-service REST API
    },
    {
        "name": "explain_code",
        "description": "Explain a code snippet or debug code errors",
        "function": explain_code
    },
    {
        "name": "recommend_next_topic",
        "description": "Suggest what to study next based on user progress",
        "function": recommend_next_topic
    },
    {
        "name": "search_exam_questions",
        "description": "Find practice MCQ questions on specific topics",
        "function": search_exam_questions
    }
]
```

#### Step 3.3 — LangGraph Flow

```mermaid
stateDiagram-v2
    [*] --> IntentClassifier
    IntentClassifier --> CourseRAG : course_question
    IntentClassifier --> DSAProblemRAG : dsa_help
    IntentClassifier --> CodeDebugger : debug_code
    IntentClassifier --> ProgressAnalyzer : user_progress
    IntentClassifier --> ExamPractice : exam_help
    IntentClassifier --> GeneralRAG : general

    CourseRAG --> ResponseGenerator
    DSAProblemRAG --> ResponseGenerator
    CodeDebugger --> ResponseGenerator
    ProgressAnalyzer --> ResponseGenerator
    ExamPractice --> ResponseGenerator
    GeneralRAG --> ResponseGenerator

    ResponseGenerator --> [*]
```

```python
# LangGraph workflow definition
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("intent_classifier", classify_intent)
workflow.add_node("course_rag", course_rag_node)
workflow.add_node("dsa_rag", dsa_rag_node)
workflow.add_node("code_debugger", code_debug_node)
workflow.add_node("progress_analyzer", progress_node)
workflow.add_node("exam_helper", exam_rag_node)
workflow.add_node("response_generator", generate_response)

# Set entry point
workflow.set_entry_point("intent_classifier")

# Add conditional edges (routing)
workflow.add_conditional_edges(
    "intent_classifier",
    route_by_intent,
    {
        "course_question": "course_rag",
        "dsa_help": "dsa_rag",
        "debug_code": "code_debugger",
        "user_progress": "progress_analyzer",
        "exam_help": "exam_helper",
        "general": "course_rag",
    }
)

# All paths converge to response_generator
for node in ["course_rag", "dsa_rag", "code_debugger", "progress_analyzer", "exam_helper"]:
    workflow.add_edge(node, "response_generator")

workflow.add_edge("response_generator", END)
app = workflow.compile()
```

---

### PHASE 4 — FastAPI Service with Streaming
> **Goal**: Expose REST + SSE endpoints for the frontend chatbot

```python
# src/main.py
from fastapi import FastAPI, Depends
from fastapi.responses import StreamingResponse
from langsmith import Client as LangSmithClient
import uvicorn

app = FastAPI(title="Code Campus AI Service", version="1.0.0")

@app.post("/api/ai/chat")
async def chat(request: ChatRequest, user=Depends(verify_jwt)):
    """Main chat endpoint — returns streaming response"""
    
    async def generate():
        async for chunk in app_graph.astream(
            input={
                "messages": [HumanMessage(content=request.message)],
                "user_id": user["id"],
                "session_id": request.session_id
            },
            config={
                "configurable": {"thread_id": request.session_id},
                "callbacks": [langsmith_tracer]   # LangSmith tracing
            }
        ):
            if "response_generator" in chunk:
                token = chunk["response_generator"].get("token", "")
                yield f"data: {json.dumps({'token': token})}\n\n"
        
        yield f"data: {json.dumps({'done': True, 'sources': sources})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")

@app.post("/api/ai/ingest")
async def trigger_ingestion(admin=Depends(verify_admin)):
    """Trigger re-ingestion of course content"""
    await run_ingestion_pipeline()
    return {"status": "ingestion complete"}

@app.get("/health")
async def health():
    return {"service": "AI Service", "status": "UP", "port": 5011}
```

---

### PHASE 5 — LangSmith Observability
> **Goal**: Full tracing, evaluation, and monitoring of every AI interaction

```python
# src/config/settings.py
import os
from langsmith import Client

# Configure LangSmith
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_PROJECT"] = "code-campus-ai"
os.environ["LANGCHAIN_API_KEY"] = "your-langsmith-api-key"
os.environ["LANGCHAIN_ENDPOINT"] = "https://api.smith.langchain.com"

langsmith_client = Client()
```

**What LangSmith gives you:**
| Feature | Benefit |
|---------|---------|
| **Run Tracing** | See every LLM call, token usage, latency |
| **Evaluation** | A/B test different prompts automatically |
| **Feedback** | Capture 👍/👎 from users |
| **Datasets** | Build golden Q&A test sets |
| **Playground** | Debug prompts without code changes |

---

### PHASE 6 — Frontend Chat Widget
> **Goal**: Add AI chatbot UI to existing React frontend

```jsx
// client/src/components/AIChatbot/AIChatbot.jsx
import { useState, useRef, useEffect } from 'react';

export default function AIChatbot() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [streaming, setStreaming] = useState(false);
    
    const sendMessage = async () => {
        setStreaming(true);
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message: input, session_id: sessionId })
        });
        
        // Stream SSE tokens
        const reader = response.body.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = new TextDecoder().decode(value);
            // Append token to last message
            setMessages(prev => appendToken(prev, text));
        }
        setStreaming(false);
    };
}
```

---

### PHASE 7 — Docker Integration
> **Goal**: Add ai-service to existing docker-compose.yml

```yaml
# Add to microservice backend/docker-compose.yml

volumes:
  chroma-data:          # ← Add this

services:
  ai-service:
    build:
      context: ./ai-service
      dockerfile: Dockerfile
    container_name: code-campus-ai
    restart: always
    ports:
      - "5011:5011"
    environment:
      - PORT=5011
      - JWT_SECRET=${JWT_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - LANGCHAIN_API_KEY=${LANGCHAIN_API_KEY}
      - LANGCHAIN_PROJECT=code-campus-ai
      - LANGCHAIN_TRACING_V2=true
      - COURSE_MONGO_URI=mongodb://mongo-course:27018/course_db
      - CODING_MONGO_URI=mongodb://mongo-coding:27019/coding_problems_db
      - EXAM_DATABASE_URL=postgres://cc_exam:cc_exam_pass@postgres-exam:5435/exam_db
      - USER_SERVICE_URL=http://user-service:5002
      - CHROMA_PERSIST_DIR=/app/chroma_db
      - VECTOR_STORE=chroma     # Switch to "pinecone" for prod
    volumes:
      - chroma-data:/app/chroma_db
    depends_on:
      - mongo-course
      - mongo-coding
      - postgres-exam
      - user-service
    networks:
      - code-campus-net
```

#### API Gateway Route Addition

```javascript
// Add to api-gateway routing
- AI_SERVICE_URL=http://ai-service:5011
// Route: /api/ai/* → ai-service:5011
```

---

## 🧰 Full Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **AI Service** | Python 3.11 + FastAPI | High-perf async API |
| **Agent Framework** | LangGraph | Stateful agent orchestration |
| **RAG Framework** | LangChain | Document loading, chains, retrievers |
| **Observability** | LangSmith | Tracing, evaluation, debugging |
| **LLM** | GPT-4o-mini (dev) / GPT-4o (prod) | Language model |
| **Embeddings** | text-embedding-3-small | Vector representation |
| **Vector DB (Dev)** | ChromaDB | Local, no infra needed |
| **Vector DB (Prod)** | Pinecone | Managed, scalable |
| **Conversation Memory** | LangGraph Checkpointer + Redis | Session persistence |
| **Streaming** | SSE (Server-Sent Events) | Real-time token streaming |
| **Frontend** | React + EventSource API | Chat widget |

---

## 📊 RAG Quality Optimization Techniques

### 1. Hybrid Search (already in plan)
- Dense (semantic) + Sparse (BM25) retrieval

### 2. Re-ranking
```python
from langchain.retrievers import ContextualCompressionRetriever
from langchain_cohere import CohereRerank

compressor = CohereRerank(model="rerank-english-v3.0", top_n=4)
compression_retriever = ContextualCompressionRetriever(
    base_compressor=compressor,
    base_retriever=hybrid_retriever
)
```

### 3. Metadata Filtering
```python
# Filter by source when user asks about specific course
retriever = vectorstore.as_retriever(
    search_kwargs={
        "filter": {"source": "course", "course_title": "DevOps"},
        "k": 6
    }
)
```

### 4. Chunk Enrichment
- Add course title, topic, difficulty to every chunk
- Include code block language tags in metadata

---

## 📁 Complete Folder Structure

```
microservice backend/
└── ai-service/
    ├── Dockerfile
    ├── requirements.txt
    ├── .env
    ├── scripts/
    │   └── ingest.py          ← Run once to build vector DB
    └── src/
        ├── main.py
        ├── config/
        │   └── settings.py
        ├── ingestion/
        │   ├── __init__.py
        │   ├── loaders.py     ← MongoDB + Postgres loaders
        │   ├── splitter.py    ← Chunking strategies
        │   └── embedder.py    ← Vector store builder
        ├── rag/
        │   ├── __init__.py
        │   ├── chain.py       ← ConversationalRetrievalChain
        │   ├── prompts.py     ← System prompt templates
        │   └── retriever.py   ← Hybrid retriever setup
        ├── agents/
        │   ├── __init__.py
        │   ├── graph.py       ← LangGraph state machine
        │   ├── nodes.py       ← Agent node functions
        │   ├── tools.py       ← Tool definitions
        │   └── memory.py      ← Session memory management
        └── api/
            ├── __init__.py
            ├── routes.py      ← FastAPI route handlers
            ├── schemas.py     ← Pydantic request/response models
            └── middleware.py  ← JWT verification
```

---

## ⏱️ Implementation Timeline

| Week | Phase | Deliverable |
|------|-------|-------------|
| **Week 1** | Phase 1 | Data ingestion pipeline — all sources loaded to ChromaDB |
| **Week 2** | Phase 2 | RAG chain working — basic Q&A on course content |
| **Week 3** | Phase 3 | LangGraph agent — intent routing + multi-tool |
| **Week 4** | Phase 4 | FastAPI service + streaming endpoints |
| **Week 5** | Phase 5 | LangSmith tracing + prompt evaluation |
| **Week 6** | Phase 6 | React chat widget + Docker integration |
| **Week 7** | Phase 7 | Production: Pinecone + Redis memory + load testing |

---

## 💰 Cost Estimation (Monthly)

| Service | Usage | Cost |
|---------|-------|------|
| **OpenAI GPT-4o-mini** | ~10K messages/mo | ~$5–15 |
| **text-embedding-3-small** | Initial + re-ingestion | ~$1 |
| **LangSmith** | Free tier (5K traces/mo) | $0 |
| **ChromaDB** | Self-hosted (Docker) | $0 |
| **Pinecone (Prod)** | Starter plan | $0–70 |
| **Total** | | **~$6–86/mo** |

---

## 🔐 Security Considerations

1. **JWT Verification**: AI service validates same JWT as other services
2. **Rate Limiting**: Add per-user rate limit (e.g., 20 msgs/hour)
3. **PII Filtering**: Don't store raw user messages in LangSmith
4. **Context Isolation**: Users can only see their own progress data
5. **Prompt Injection Guards**: Validate/sanitize user input before injection into prompts

---

> [!NOTE]
> **Start with ChromaDB** (zero infra) for development. Switch to **Pinecone** only when you need production-scale. The code only changes one line (`VECTOR_STORE=pinecone` in env).

> [!TIP]
> Use **GPT-4o-mini** for 90% of queries (10x cheaper). Only escalate to GPT-4o for complex code debugging using a simple token-count heuristic in the agent router.
