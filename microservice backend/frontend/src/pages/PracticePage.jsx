import { useMemo, useState } from "react";
import { ArrowRight, Braces, Search } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { api, getItems } from "../lib/api";
import { useResource } from "../lib/useResource";
import { Badge, PageHeading, Panel, ResourceState } from "../components/ui";

const topics = ["All topics", "Array", "String", "Tree", "Graph", "DP", "Sorting"];

export function PracticePage() {
  const [difficulty, setDifficulty] = useState("");
  const [topic, setTopic] = useState("");
  const [query, setQuery] = useState("");
  const [solvedCount] = useState(
    () => Number(sessionStorage.getItem("cc-solved") || 0),
  );
  const { data, loading, error, reload } = useResource(
    () =>
      api(
        `/coding/problems?difficulty=${encodeURIComponent(
          difficulty,
        )}&dsaTopic=${encodeURIComponent(topic)}`,
      ).then((result) => getItems(result, ["problems", "data"])),
    [difficulty, topic],
  );

  const filtered = useMemo(
    () =>
      (data || []).filter((problem) =>
        `${problem.title || ""} ${problem.dsaTopic || ""}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [data, query],
  );

  return (
    <div>
      <PageHeading
        eyebrow="Hands-on practice"
        title="Coding problems"
        description="Build fluency by solving algorithmic challenges, one problem at a time."
      />

      <Panel className="mb-5 p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_190px_190px]">
          <label className="relative block">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search problems..."
              aria-label="Search coding problems"
              className="h-10 w-full border border-line bg-surface pl-9 pr-3 text-sm focus:border-brand focus:outline-none"
            />
          </label>
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            className="h-10 border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none"
            aria-label="Filter by difficulty"
          >
            <option value="">All difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            className="h-10 border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none"
            aria-label="Filter by topic"
          >
            <option value="">All topics</option>
            {topics.slice(1).map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        {solvedCount > 0 && (
          <p className="mt-3 text-xs text-positive">
            You’ve solved {solvedCount} problem{solvedCount === 1 ? "" : "s"} in this session.
          </p>
        )}
      </Panel>

      <div className="mb-3 text-sm text-muted">
        {loading ? "Loading problems…" : `${filtered.length} problems`}
      </div>
      <ResourceState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={
          query || topic || difficulty
            ? "No problems match these filters."
            : "There are no coding problems available yet."
        }
      >
        <div className="grid gap-3">
          {filtered.map((problem) => (
            <Panel
              key={problem._id}
              className="flex flex-col gap-4 p-4 transition-colors hover:border-brand/40 sm:flex-row sm:items-center sm:p-5"
            >
              <div className="grid size-10 shrink-0 place-items-center bg-brand-soft text-brand">
                <Braces size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">{problem.title}</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge
                    tone={
                      problem.difficulty === "easy"
                        ? "positive"
                        : problem.difficulty === "hard"
                          ? "negative"
                          : "warning"
                    }
                  >
                    {problem.difficulty || "Practice"}
                  </Badge>
                  {problem.dsaTopic && <Badge>{problem.dsaTopic}</Badge>}
                </div>
              </div>
              <Link
                to={`/practice/${problem._id}`}
                className="inline-flex min-h-10 items-center justify-center gap-2 border border-line px-4 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
              >
                Solve problem <ArrowRight size={15} />
              </Link>
            </Panel>
          ))}
        </div>
      </ResourceState>
    </div>
  );
}

export function ProblemDetailPage() {
  const { id } = useParams();
  return <ProblemDetail problemId={id} />;
}

function ProblemDetail({ problemId }) {
  const [code, setCode] = useState(
    'const fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim();\n\n// Read the test input, solve the problem, and print your result.\nconsole.log(input);\n',
  );
  const [language, setLanguage] = useState("javascript");
  const [result, setResult] = useState(null);
  const [submissionError, setSubmissionError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { data: problem, loading, error, reload } = useResource(
    () => api(`/coding/problems/${problemId}`),
    [problemId],
  );

  async function runCode() {
    setSubmitting(true);
    setSubmissionError("");
    setResult(null);
    try {
      const response = await api(`/coding/submit/${problemId}?save=true`, {
        method: "POST",
        body: { code, language },
      });
      setResult(response);
      if (response.result === "Accepted") {
        const solved = Number(sessionStorage.getItem("cc-solved") || 0) + 1;
        sessionStorage.setItem("cc-solved", String(solved));
      }
    } catch (reason) {
      setSubmissionError(reason.message || "Code execution failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const examples = Array.isArray(problem?.examples) ? problem.examples : [];
  const constraints = Array.isArray(problem?.constraints)
    ? problem.constraints
    : typeof problem?.constraints === "string"
      ? problem.constraints.split(/\r?\n/).filter(Boolean)
      : [];

  return (
    <div>
      <Link
        to="/practice"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-brand"
      >
        <ArrowBackIcon /> All problems
      </Link>
      <ResourceState loading={loading} error={error} onRetry={reload}>
        <PageHeading
          eyebrow="Coding challenge"
          title={problem?.title || "Problem"}
          description={problem?.difficulty ? `${problem.difficulty} · ${problem.dsaTopic || "Problem solving"}` : problem?.dsaTopic}
        />
        <div className="grid items-start gap-5 xl:grid-cols-2">
          <Panel className="p-5">
            <Badge tone={problem?.difficulty === "easy" ? "positive" : problem?.difficulty === "hard" ? "negative" : "warning"}>
              {problem?.difficulty || "Challenge"}
            </Badge>
            <h2 className="mt-4 font-semibold">Problem description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">
              {problem?.description || "Read the examples and implement a solution."}
            </p>
            {examples.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold">Examples</h3>
                <div className="grid gap-3">
                  {examples.map((example, index) => (
                    <div key={example._id || index} className="border border-line bg-surface-subtle p-3">
                      <p className="mb-2 text-xs font-semibold text-muted">Example {index + 1}</p>
                      <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-ink">
                        <span className="text-muted">Input: </span>{example.input}
                        {"\n"}
                        <span className="text-muted">Output: </span>{example.output}
                        {example.explanation ? `\nExplanation: ${example.explanation}` : ""}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {constraints.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-semibold">Constraints</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                  {constraints.map((constraint, index) => (
                    <li key={index}>{constraint}</li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>

          <Panel className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-subtle p-3">
              <div>
                <h2 className="text-sm font-semibold">Solution workspace</h2>
                <p className="mt-0.5 text-xs text-muted">
                  Submissions run against the challenge test cases.
                </p>
              </div>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="h-9 border border-line bg-surface px-2 text-xs text-ink focus:border-brand focus:outline-none"
                aria-label="Programming language"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
              </select>
            </div>
            <textarea
              value={code}
              onChange={(event) => setCode(event.target.value)}
              spellCheck="false"
              aria-label="Your code"
              className="min-h-[360px] w-full resize-y border-0 bg-[#101820] p-4 font-mono text-[13px] leading-6 text-[#e7edf3] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand"
            />
            {submissionError && (
              <p role="alert" className="m-4 border border-negative/25 bg-negative/10 px-3 py-2 text-sm text-negative">
                {submissionError}
              </p>
            )}
            {result && (
              <div className={`m-4 border p-3 ${result.result === "Accepted" ? "border-positive/25 bg-positive/10" : "border-warning/25 bg-warning/10"}`}>
                <p className={`text-sm font-semibold ${result.result === "Accepted" ? "text-positive" : "text-warning"}`}>
                  {result.result} · {result.passedCount}/{result.totalCount} test cases passed
                </p>
                {Array.isArray(result.visibleDetails) && (
                  <div className="mt-2 grid gap-2">
                    {result.visibleDetails.map((test, index) => (
                      <p key={test.index ?? index} className="text-xs text-muted">
                        Test {index + 1}: {test.status}
                        {test.userOutput ? ` — output: ${test.userOutput}` : ""}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end border-t border-line p-3">
              <Button onClick={runCode} disabled={submitting || !code.trim()}>
                {submitting ? "Running…" : "Run & submit"} <ArrowRight size={15} />
              </Button>
            </div>
          </Panel>
        </div>
      </ResourceState>
    </div>
  );
}

function ArrowBackIcon() {
  return <ArrowRight className="rotate-180" size={16} />;
}
