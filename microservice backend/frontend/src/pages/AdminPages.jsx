import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FilePlus2,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useResource } from "../lib/useResource";
import {
  Button,
  PageHeading,
  Panel,
  ResourceState,
} from "../components/ui";

export function AdminDashboardPage() {
  const { data, loading, error, reload } = useResource(() =>
    api("/posts/dashboard/metrics"),
  );

  return (
    <div>
      <PageHeading
        eyebrow="Administration"
        title="Content workspace"
        description="Manage learning content and review a snapshot of community activity."
        action={
          <span className="inline-flex items-center gap-2 border border-positive/25 bg-positive/10 px-3 py-2 text-xs font-semibold text-positive">
            <ShieldCheck size={15} /> Administrator access
          </span>
        }
      />
      <ResourceState loading={loading} error={error} onRetry={reload}>
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Community posts" value={data?.totalPosts ?? 0} />
          <Metric label="Comments" value={data?.totalComments ?? 0} />
          <Metric label="Reactions" value={data?.totalLikes ?? 0} />
        </div>
      </ResourceState>

      <div className="grid gap-4 md:grid-cols-2">
        <AdminAction
          to="/admin/courses/new"
          icon={BookOpen}
          title="Create a course"
          description="Publish a new learning track to the course catalog."
          action="Create course"
        />
        <AdminAction
          to="/admin/exams/new"
          icon={FilePlus2}
          title="Create an assessment"
          description="Build a timed assessment with multiple-choice questions."
          action="Create assessment"
        />
      </div>
    </div>
  );
}

export function AdminCourseCreatePage() {
  const [form, setForm] = useState({ title: "", description: "" });
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const body = new FormData();
    body.set("title", form.title);
    body.set("description", form.description);
    if (image) body.set("image", image);
    try {
      await api("/courses", { method: "POST", body });
      navigate("/courses");
    } catch (reason) {
      setError(reason.message || "We couldn’t create this course.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <BackToAdmin />
      <PageHeading
        eyebrow="Course management"
        title="Create a course"
        description="Add a clear title and description to introduce this learning track."
      />
      <Panel className="p-5 sm:p-7">
        {error && <FormError>{error}</FormError>}
        <form onSubmit={submit} className="grid gap-5">
          <AdminField
            label="Course title"
            value={form.title}
            required
            maxLength={120}
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="e.g. Modern Java & Distributed Systems"
          />
          <label className="grid gap-2 text-sm font-semibold">
            Description
            <textarea
              value={form.description}
              required
              rows={5}
              maxLength={2000}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className="resize-y border border-line bg-surface px-3 py-2 text-sm font-normal text-ink focus:border-brand focus:outline-none"
              placeholder="Describe what learners will build and learn."
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Cover image <span className="font-normal text-muted">Optional</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setImage(event.target.files?.[0] || null)}
              className="border border-line bg-surface px-3 py-2 text-sm font-normal text-ink file:mr-3 file:border-0 file:bg-brand-soft file:px-3 file:py-1 file:font-semibold file:text-brand"
            />
          </label>
          <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
            <Link
              to="/admin"
              className="inline-flex min-h-10 items-center border border-line px-4 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
            >
              Cancel
            </Link>
            <Button type="submit" disabled={saving || !form.title.trim()}>
              {saving ? "Publishing…" : "Publish course"} <ArrowRight size={15} />
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}

export function AdminExamCreatePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(30);
  const [questions, setQuestions] = useState([
    { question: "", options: ["", "", "", ""], answer: "" },
  ]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  function updateQuestion(index, changes) {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...changes } : question,
      ),
    );
  }

  function updateOption(questionIndex, optionIndex, value) {
    setQuestions((current) =>
      current.map((question, currentIndex) => {
        if (questionIndex !== currentIndex) return question;
        const oldValue = question.options[optionIndex];
        const options = question.options.map((option, currentOption) =>
          currentOption === optionIndex ? value : option,
        );
        return {
          ...question,
          options,
          answer: question.answer === oldValue ? value : question.answer,
        };
      }),
    );
  }

  async function submit(event) {
    event.preventDefault();
    const incomplete = questions.some(
      (question) =>
        !question.question.trim() ||
        question.options.some((option) => !option.trim()) ||
        !question.answer,
    );
    if (incomplete) {
      setError("Complete each question, all four options, and choose its correct answer.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api("/exams", {
        method: "POST",
        body: {
          title,
          description,
          duration: Number(duration),
          questions: questions.map((question) => ({
            ...question,
            options: question.options.map((option) => option.trim()),
          })),
        },
      });
      navigate("/exams");
    } catch (reason) {
      setError(reason.message || "We couldn’t create this assessment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <BackToAdmin />
      <PageHeading
        eyebrow="Assessment management"
        title="Create an assessment"
        description="Write multiple-choice questions and set a time limit for learners."
      />
      <Panel className="p-5 sm:p-7">
        {error && <FormError>{error}</FormError>}
        <form onSubmit={submit} className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
            <AdminField
              label="Assessment title"
              value={title}
              required
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. JavaScript fundamentals"
            />
            <AdminField
              label="Duration (minutes)"
              type="number"
              value={duration}
              min={1}
              max={240}
              required
              onChange={(event) => setDuration(event.target.value)}
            />
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            Description
            <textarea
              value={description}
              rows={3}
              onChange={(event) => setDescription(event.target.value)}
              className="resize-y border border-line bg-surface px-3 py-2 text-sm font-normal text-ink focus:border-brand focus:outline-none"
              placeholder="What topics does this assessment cover?"
            />
          </label>

          <div className="grid gap-4">
            {questions.map((question, index) => (
              <section
                key={index}
                className="border border-line bg-surface-subtle p-4 sm:p-5"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold">Question {index + 1}</h2>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setQuestions((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                      aria-label={`Remove question ${index + 1}`}
                      className="grid size-8 place-items-center text-muted hover:bg-negative/10 hover:text-negative"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                <label className="grid gap-2 text-sm font-semibold">
                  Question
                  <textarea
                    value={question.question}
                    rows={2}
                    required
                    onChange={(event) =>
                      updateQuestion(index, { question: event.target.value })
                    }
                    className="resize-y border border-line bg-surface px-3 py-2 text-sm font-normal text-ink focus:border-brand focus:outline-none"
                    placeholder="Enter your question"
                  />
                </label>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {question.options.map((option, optionIndex) => (
                    <label
                      key={optionIndex}
                      className="grid gap-2 text-xs font-semibold text-muted"
                    >
                      Option {String.fromCharCode(65 + optionIndex)}
                      <input
                        value={option}
                        required
                        onChange={(event) =>
                          updateOption(index, optionIndex, event.target.value)
                        }
                        className="h-10 border border-line bg-surface px-3 text-sm font-normal text-ink focus:border-brand focus:outline-none"
                        placeholder={`Answer choice ${optionIndex + 1}`}
                      />
                    </label>
                  ))}
                </div>
                <label className="mt-4 grid gap-2 text-sm font-semibold">
                  Correct answer
                  <select
                    value={question.answer}
                    required
                    onChange={(event) =>
                      updateQuestion(index, { answer: event.target.value })
                    }
                    className="h-10 border border-line bg-surface px-3 text-sm font-normal text-ink focus:border-brand focus:outline-none"
                  >
                    <option value="">Choose the correct answer</option>
                    {question.options
                      .map((option) => option.trim())
                      .filter(Boolean)
                      .map((option, optionIndex) => (
                        <option key={`${optionIndex}-${option}`} value={option}>
                          {option}
                        </option>
                      ))}
                  </select>
                </label>
              </section>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              setQuestions((current) => [
                ...current,
                { question: "", options: ["", "", "", ""], answer: "" },
              ])
            }
            className="inline-flex min-h-10 items-center justify-center gap-2 border border-dashed border-line px-4 text-sm font-semibold text-muted hover:border-brand hover:text-brand"
          >
            <Plus size={16} /> Add question
          </button>

          <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
            <Link
              to="/admin"
              className="inline-flex min-h-10 items-center border border-line px-4 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
            >
              Cancel
            </Link>
            <Button type="submit" disabled={saving || !title.trim()}>
              {saving ? "Publishing…" : "Publish assessment"} <ArrowRight size={15} />
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <Panel className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </Panel>
  );
}

function AdminAction({ to, icon: Icon, title, description, action }) {
  return (
    <Panel className="p-5 sm:p-6">
      <div className="grid size-11 place-items-center bg-brand-soft text-brand">
        <Icon size={21} />
      </div>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-2 min-h-10 text-sm leading-5 text-muted">
        {description}
      </p>
      <Link
        to={to}
        className="mt-5 inline-flex min-h-10 items-center gap-2 bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-strong"
      >
        {action} <ArrowRight size={15} />
      </Link>
    </Panel>
  );
}

function BackToAdmin() {
  return (
    <Link
      to="/admin"
      className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-brand"
    >
      <ArrowLeft size={16} /> Admin workspace
    </Link>
  );
}

function AdminField({ label, ...props }) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <input
        className="h-10 border border-line bg-surface px-3 text-sm font-normal text-ink placeholder:text-muted focus:border-brand focus:outline-none"
        {...props}
      />
    </label>
  );
}

function FormError({ children }) {
  return (
    <p role="alert" className="mb-5 border border-negative/25 bg-negative/10 px-3 py-2 text-sm text-negative">
      {children}
    </p>
  );
}
