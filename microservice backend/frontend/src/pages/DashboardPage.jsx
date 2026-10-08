import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpenCheck,
  Braces,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Layers3,
  MessageSquareText,
  Server,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api, getItems } from "../lib/api";
import { useResource } from "../lib/useResource";
import { Badge, PageHeading, Panel, ResourceState } from "../components/ui";

const quickLinks = [
  {
    to: "/courses",
    title: "Explore learning tracks",
    description: "Find a practical path and build job-ready skills.",
    icon: BookOpenCheck,
    color: "text-brand",
  },
  {
    to: "/exams",
    title: "Take an assessment",
    description: "Check your understanding and track your progress.",
    icon: CheckCircle2,
    color: "text-positive",
  },
  {
    to: "/practice",
    title: "Practice coding",
    description: "Sharpen your problem-solving with DSA challenges.",
    icon: Braces,
    color: "text-warning",
  },
];

export function DashboardPage() {
  const { data, loading, error, reload } = useResource(async () => {
    const [health, courses, exams, problems] = await Promise.allSettled([
      api("/../health"),
      api("/courses"),
      api("/exams"),
      api("/coding/problems"),
    ]);
    const failed = [courses, exams, problems].filter(
      (result) => result.status === "rejected",
    );
    if (failed.length === 3) throw failed[0].reason;

    return {
      gateway:
        health.status === "fulfilled" && health.value?.status === "healthy",
      courses:
        courses.status === "fulfilled"
          ? getItems(courses.value, ["courses", "data"])
          : [],
      exams:
        exams.status === "fulfilled"
          ? getItems(exams.value, ["exams", "data"])
          : [],
      problems:
        problems.status === "fulfilled"
          ? getItems(problems.value, ["problems", "data"])
          : [],
      partialError: failed.length
        ? "Some sections are unavailable. Check that all backend services are running."
        : "",
    };
  });

  return (
    <div>
      <PageHeading
        eyebrow="Your learning workspace"
        title="Good to see you."
        description="A focused place to learn, practice, and make progress every day."
        action={
          <Link
            to="/courses"
            className="inline-flex min-h-10 items-center gap-2 bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-strong"
          >
            Browse courses <ArrowRight size={16} />
          </Link>
        }
      />

      <Panel className="mb-8 flex flex-col justify-between gap-6 overflow-hidden border-brand/15 bg-[linear-gradient(112deg,var(--cc-surface)_45%,var(--cc-brand-soft))] p-6 sm:flex-row sm:items-center sm:p-8">
        <div className="max-w-2xl">
          <Badge tone="brand">
            <Sparkles className="mr-1.5" size={13} /> Welcome to Code Campus
          </Badge>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
            Grow your skills, one step at a time.
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            Explore hands-on learning tracks, assess your knowledge, and
            practice the concepts that move your career forward.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/courses"
              className="inline-flex min-h-10 items-center gap-2 bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-strong"
            >
              Find your next course <ArrowRight size={16} />
            </Link>
            <Link
              to="/community"
              className="inline-flex min-h-10 items-center border border-line bg-surface px-4 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
            >
              Join the community
            </Link>
          </div>
        </div>
        <div className="hidden shrink-0 sm:block">
          <div className="grid size-32 place-items-center border border-brand/10 bg-surface text-brand shadow-sm">
            <GraduationCap size={66} strokeWidth={1.25} />
          </div>
        </div>
      </Panel>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Learning tracks"
          value={data?.courses?.length ?? "—"}
          icon={Layers3}
          detail="Explore the catalog"
          to="/courses"
        />
        <SummaryCard
          label="Assessments"
          value={data?.exams?.length ?? "—"}
          icon={Clock3}
          detail="Test your knowledge"
          to="/exams"
        />
        <SummaryCard
          label="Coding challenges"
          value={data?.problems?.length ?? "—"}
          icon={Braces}
          detail="Practice problem solving"
          to="/practice"
        />
        <Panel className="flex items-center gap-4 p-5">
          <div
            className={`grid size-11 shrink-0 place-items-center ${
              data?.gateway ? "bg-positive/10 text-positive" : "bg-warning/10 text-warning"
            }`}
          >
            <Server size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Platform status
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
              <span
                className={`size-2 ${
                  data?.gateway ? "bg-positive" : "bg-warning"
                }`}
              />
              {data?.gateway ? "Services connected" : "Checking gateway"}
            </p>
          </div>
        </Panel>
      </div>

      <ResourceState
        loading={loading}
        error={error}
        onRetry={reload}
      >
        {data?.partialError && (
          <p className="mb-5 border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            {data.partialError}
          </p>
        )}
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <Panel className="p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Pick up a new skill</h2>
                <p className="mt-1 text-sm text-muted">
                  A few ways to move forward today.
                </p>
              </div>
              <Link
                to="/courses"
                className="hidden items-center gap-1 text-sm font-semibold text-brand hover:text-brand-strong sm:flex"
              >
                All courses <ArrowUpRight size={15} />
              </Link>
            </div>
            <div className="divide-y divide-line">
              {data?.courses?.slice(0, 3).map((course) => (
                <Link
                  key={course._id}
                  to={`/courses/${course._id}`}
                  className="group flex items-center gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div className="grid size-10 shrink-0 place-items-center bg-brand-soft text-brand">
                    <BookOpenCheck size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink group-hover:text-brand">
                      {course.title}
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs text-muted">
                      {course.description || "Explore this learning track"}
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-brand"
                  />
                </Link>
              ))}
              {data?.courses?.length === 0 && (
                <p className="py-4 text-sm text-muted">
                  Course catalog is currently empty.
                </p>
              )}
            </div>
          </Panel>

          <Panel className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Your next step</h2>
            <p className="mt-1 text-sm text-muted">
              Choose a space and keep your momentum going.
            </p>
            <div className="mt-4 grid gap-2">
              {quickLinks.map(({ to, title, description, icon: Icon, color }) => (
                <Link
                  key={to}
                  to={to}
                  className="group flex items-center gap-3 border border-line p-3 transition-colors hover:border-brand/40 hover:bg-surface-subtle"
                >
                  <Icon size={18} className={color} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-0.5 text-xs text-muted">{description}</p>
                  </div>
                  <ArrowRight
                    size={15}
                    className="text-muted group-hover:text-brand"
                  />
                </Link>
              ))}
            </div>
            <Link
              to="/community"
              className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-sm font-medium text-muted hover:text-brand"
            >
              <MessageSquareText size={16} />
              Learn alongside the community
            </Link>
          </Panel>
        </div>
      </ResourceState>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, detail, to }) {
  return (
    <Link to={to} className="block">
      <Panel className="flex items-center gap-4 p-5 transition-colors hover:border-brand/40">
        <div className="grid size-11 shrink-0 place-items-center bg-brand-soft text-brand">
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          <p className="mt-0.5 truncate text-xs text-muted">{detail}</p>
        </div>
      </Panel>
    </Link>
  );
}
