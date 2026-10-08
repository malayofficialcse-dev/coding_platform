import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock3,
  FileCheck2,
  ListChecks,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { api, getItems } from "../lib/api";
import { useResource } from "../lib/useResource";
import {
  Badge,
  Button,
  PageHeading,
  Panel,
  ResourceState,
} from "../components/ui";

export function ExamsPage() {
  const { data, loading, error, reload } = useResource(async () =>
    getItems(await api("/exams"), ["exams", "data"]),
  );

  return (
    <div>
      <PageHeading
        eyebrow="Measure your progress"
        title="Assessments"
        description="Put your knowledge into practice with focused assessments."
        action={
          <Link
            to="/attempts"
            className="inline-flex min-h-10 items-center gap-2 border border-line bg-surface px-4 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
          >
            <FileCheck2 size={16} /> My results
          </Link>
        }
      />
      <ResourceState
        loading={loading}
        error={error}
        onRetry={reload}
        empty="There are no assessments available right now."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((exam) => (
            <Panel key={exam._id} className="flex min-h-56 flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="grid size-10 place-items-center bg-brand-soft text-brand">
                  <ListChecks size={20} />
                </div>
                <Badge>{exam.duration || 30} min</Badge>
              </div>
              <h2 className="mt-4 text-lg font-semibold">{exam.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted">
                {exam.description || "Review your understanding with this assessment."}
              </p>
              <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <Clock3 size={14} /> Timed assessment
                </span>
                <Link
                  to={`/exams/${exam._id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-strong"
                >
                  View assessment <ArrowRight size={15} />
                </Link>
              </div>
            </Panel>
          ))}
        </div>
      </ResourceState>
    </div>
  );
}

export function ExamDetailPage() {
  const { id } = useParams();
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const submittedRef = useRef(false);
  const {
    data,
    loading,
    error,
    reload,
  } = useResource(async () => {
    const [exam, attempts] = await Promise.all([
      api(`/exams/${id}`),
      api("/attempts/my"),
    ]);
    const previous = getItems(attempts, ["attempts", "data"]).find(
      (attempt) => String(attempt.exam?._id || attempt.exam) === id,
    );
    return { exam, previous };
  }, [id]);

  async function submit(autoSubmitted = false) {
    if (!data?.exam || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setSubmitError("");
    try {
      const result = await api("/attempts", {
        method: "POST",
        body: {
          examId: id,
          answers,
          autoSubmitted,
          warningsCount: 0,
          cheatingLogged: false,
        },
      });
      setSubmitted(result.attempt || result);
      setStarted(false);
    } catch (reason) {
      submittedRef.current = false;
      setSubmitError(reason.message || "We couldn’t submit your assessment.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!started || submitted || secondsLeft === null) return undefined;
    const timer = window.setInterval(
      () => setSecondsLeft((remaining) => Math.max(remaining - 1, 0)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [started, submitted, secondsLeft === null]);

  useEffect(() => {
    if (started && secondsLeft === 0 && !submittedRef.current) {
      submit(true);
    }
  }, [secondsLeft, started]);

  const exam = data?.exam;
  const questions = Array.isArray(exam?.questions) ? exam.questions : [];
  const durationMinutes = Number(exam?.duration) || 30;
  const minutes = Math.floor((secondsLeft || 0) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = ((secondsLeft || 0) % 60).toString().padStart(2, "0");

  return (
    <div>
      <Link
        to="/exams"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-brand"
      >
        <ArrowLeft size={16} /> All assessments
      </Link>
      <ResourceState loading={loading} error={error} onRetry={reload}>
        {data?.previous ? (
          <Panel className="mx-auto max-w-2xl p-6 text-center sm:p-10">
            <div className="mx-auto grid size-14 place-items-center bg-positive/10 text-positive">
              <CheckCircle2 size={27} />
            </div>
            <h1 className="mt-4 text-2xl font-semibold">
              You’ve completed this assessment
            </h1>
            <p className="mt-2 text-sm text-muted">
              Your score: {data.previous.score ?? 0} of {questions.length}
            </p>
            <Link
              to="/attempts"
              className="mt-5 inline-flex min-h-10 items-center gap-2 bg-brand px-4 text-sm font-semibold text-white"
            >
              View all results <ArrowRight size={16} />
            </Link>
          </Panel>
        ) : submitted ? (
          <Panel className="mx-auto max-w-2xl p-6 text-center sm:p-10">
            <div className="mx-auto grid size-14 place-items-center bg-brand-soft text-brand">
              <Award size={27} />
            </div>
            <h1 className="mt-4 text-2xl font-semibold">Assessment submitted</h1>
            <p className="mt-2 text-muted">{exam?.title}</p>
            <p className="mt-5 text-4xl font-semibold tracking-tight text-brand">
              {submitted.score ?? 0}
              <span className="text-xl text-muted"> / {questions.length}</span>
            </p>
            <p className="mt-2 text-sm text-muted">
              {submitted.autoSubmitted
                ? "Your answers were submitted when the time limit ended."
                : "Your result has been saved to your account."}
            </p>
            <Link
              to="/attempts"
              className="mt-6 inline-flex min-h-10 items-center gap-2 bg-brand px-4 text-sm font-semibold text-white"
            >
              View results <ArrowRight size={16} />
            </Link>
          </Panel>
        ) : !started ? (
          <Panel className="mx-auto max-w-2xl p-6 sm:p-9">
            <Badge tone="brand">Assessment</Badge>
            <h1 className="mt-4 text-2xl font-semibold">{exam?.title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              {exam?.description || "Answer each question and submit your assessment before time runs out."}
            </p>
            <div className="my-6 grid gap-3 border-y border-line py-5 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <Clock3 className="text-brand" size={18} />
                <div>
                  <p className="text-sm font-semibold">{durationMinutes} minutes</p>
                  <p className="text-xs text-muted">Time limit</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ListChecks className="text-brand" size={18} />
                <div>
                  <p className="text-sm font-semibold">{questions.length} questions</p>
                  <p className="text-xs text-muted">One answer per question</p>
                </div>
              </div>
            </div>
            <p className="mb-5 text-xs leading-5 text-muted">
              Once started, the timer cannot be paused. Your work is submitted
              automatically when time expires.
            </p>
            <Button
              onClick={() => {
                setAnswers(Array(questions.length).fill(""));
                setSecondsLeft(durationMinutes * 60);
                setStarted(true);
              }}
            >
              Start assessment <ArrowRight size={16} />
            </Button>
          </Panel>
        ) : (
          <div className="mx-auto max-w-4xl">
            <div className="sticky top-[74px] z-20 mb-5 flex items-center justify-between gap-3 border border-line bg-surface p-3 shadow-[var(--cc-shadow)] sm:px-5">
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold sm:text-base">
                  {exam?.title}
                </h1>
                <p className="mt-0.5 text-xs text-muted">
                  {answers.filter(Boolean).length} of {questions.length} answered
                </p>
              </div>
              <Badge tone={secondsLeft < 60 ? "negative" : "brand"}>
                <Clock3 size={13} className="mr-1.5" /> {minutes}:{seconds}
              </Badge>
            </div>

            {submitError && (
              <div className="mb-4 border border-negative/25 bg-negative/10 px-4 py-3 text-sm text-negative">
                {submitError}
              </div>
            )}

            <div className="grid gap-4">
              {questions.map((question, index) => (
                <Panel key={question._id || index} className="p-5 sm:p-6">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">
                    Question {index + 1} of {questions.length}
                  </p>
                  <h2 className="text-base font-semibold leading-6">
                    {question.question}
                  </h2>
                  <div className="mt-4 grid gap-2">
                    {(question.options || []).map((option, optionIndex) => (
                      <label
                        key={`${index}-${optionIndex}`}
                        className={`flex cursor-pointer items-center gap-3 border p-3 text-sm transition-colors ${
                          answers[index] === option
                            ? "border-brand bg-brand-soft"
                            : "border-line hover:border-brand/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${index}`}
                          value={option}
                          checked={answers[index] === option}
                          onChange={() =>
                            setAnswers((current) =>
                              current.map((answer, answerIndex) =>
                                answerIndex === index ? option : answer,
                              ),
                            )
                          }
                          className="accent-[var(--cc-brand)]"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </Panel>
              ))}
            </div>
            <div className="mt-5 flex justify-end">
              <Button
                onClick={() => submit(false)}
                disabled={submitting}
              >
                {submitting ? "Submitting…" : "Submit assessment"}
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </ResourceState>
    </div>
  );
}

export function AttemptsPage() {
  const { data, loading, error, reload } = useResource(async () =>
    getItems(await api("/attempts/my"), ["attempts", "data"]),
  );

  return (
    <div>
      <PageHeading
        eyebrow="Your progress"
        title="Assessment results"
        description="Review the assessments you’ve completed."
        action={
          <Link
            to="/exams"
            className="inline-flex min-h-10 items-center gap-2 bg-brand px-4 text-sm font-semibold text-white"
          >
            Browse assessments <ArrowRight size={15} />
          </Link>
        }
      />
      <ResourceState
        loading={loading}
        error={error}
        onRetry={reload}
        empty="Your submitted assessments will appear here."
      >
        <div className="grid gap-3">
          {data.map((attempt) => {
            const total = attempt.exam?.questions?.length || 0;
            return (
              <Panel
                key={attempt._id}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5"
              >
                <div className="grid size-10 shrink-0 place-items-center bg-positive/10 text-positive">
                  <CheckCircle2 size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold">
                    {attempt.exam?.title || "Assessment"}
                  </h2>
                  <p className="mt-1 text-xs text-muted">
                    Completed{" "}
                    {attempt.createdAt
                      ? new Date(attempt.createdAt).toLocaleDateString()
                      : "recently"}
                    {attempt.autoSubmitted ? " · Submitted automatically" : ""}
                  </p>
                </div>
                <Badge tone="brand">
                  Score: {attempt.score ?? 0}
                  {total ? ` / ${total}` : ""}
                </Badge>
              </Panel>
            );
          })}
        </div>
      </ResourceState>
    </div>
  );
}
