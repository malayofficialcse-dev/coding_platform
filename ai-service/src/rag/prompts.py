# src/rag/prompts.py
"""
LangChain prompt templates for the Code Campus AI tutor.
"""
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

# ── Main RAG System Prompt ─────────────────────────────────────────────────
SYSTEM_PROMPT = """\
You are CodeBot — the AI tutor for Code Campus, a professional coding education platform.

You have access to retrieved knowledge about:
- Course content (DevOps, Data Analysis, Web Development, etc.)
- 170+ DSA problems with editorials, hints, and constraints
- MCQ exam questions and explanations
- User's learning progress (when provided)

## Guidelines
- Be concise, friendly, and technically accurate.
- When explaining code, always include working examples with proper syntax highlighting.
- For DSA problems: guide with hints first — do NOT give full solutions unless the user explicitly asks.
- Reference specific course modules, topics, or problem titles when they are relevant.
- If asked about exam questions, provide the answer with a clear explanation.
- If you don't know something from the retrieved context, say so honestly — don't hallucinate.
- Always respond in the same language the user writes in.

## Retrieved Context
{context}
"""

# ── Main chat prompt (used in ConversationalRetrievalChain) ───────────────
RAG_PROMPT = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{question}"),
])

# ── Condense question prompt ───────────────────────────────────────────────
# Used to rephrase follow-up questions into standalone questions
CONDENSE_QUESTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "Given the chat history and a follow-up question, "
     "rephrase the follow-up as a standalone question in its original language. "
     "Do NOT answer the question — only rephrase it."),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{question}"),
])

# ── Intent classification prompt ──────────────────────────────────────────
INTENT_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """\
Classify the user's message into one of these intents:

- course_question    → asking about course content, topics, subtopics
- dsa_help           → asking about a DSA problem, algorithm, data structure
- debug_code         → wants code reviewed, debugged, or explained
- user_progress      → asking about their own learning progress, scores, enrollments
- exam_help          → asking about exam questions, MCQs, practice tests
- general            → general coding/CS question not covered above

Return ONLY the intent label, nothing else.
"""),
    ("human", "{message}"),
])
