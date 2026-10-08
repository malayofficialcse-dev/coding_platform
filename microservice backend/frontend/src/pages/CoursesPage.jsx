import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { api, getItems, hasSession } from "../lib/api";
import { useResource } from "../lib/useResource";
import { Badge, Button, PageHeading, Panel, ResourceState } from "../components/ui";

export function CoursesPage() {
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [busyCourse, setBusyCourse] = useState("");
  const { data, loading, error, reload } = useResource(async () =>
    getItems(await api("/courses"), ["courses", "data"]),
  );

  const courses = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (data || []).filter(
      (course) =>
        `${course.title || ""} ${course.description || ""}`
          .toLowerCase()
          .includes(normalized),
    );
  }, [data, query]);

  async function enroll(courseId) {
    if (!hasSession()) return;
    setBusyCourse(courseId);
    setNotice("");
    try {
      await api("/enrollments/enroll", {
        method: "POST",
        body: { courseId },
      });
      setNotice("You’re enrolled. Your learning track is ready.");
    } catch (reason) {
      setNotice(reason.message || "We couldn’t complete your enrollment.");
    } finally {
      setBusyCourse("");
    }
  }

  return (
    <div>
      <PageHeading
        eyebrow="Learning library"
        title="Courses & learning tracks"
        description="Structured pathways, practical content, and a clear next step for every learner."
        action={
          <Badge tone="positive">
            <Sparkles className="mr-1.5" size={13} /> Learn at your own pace
          </Badge>
        }
      />

      <Panel className="mb-5 p-4 sm:p-5">
        <label className="relative block">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search courses by title or topic..."
            aria-label="Search courses"
            className="h-11 w-full border border-line bg-surface pl-10 pr-3 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none"
          />
        </label>
      </Panel>

      {notice && (
        <div className="mb-5 border border-brand/25 bg-brand-soft px-4 py-3 text-sm text-brand">
          {notice}
        </div>
      )}

      <div className="mb-3 flex items-center justify-between gap-3 text-sm text-muted">
        <span>
          {loading ? "Loading courses…" : `${courses.length} learning tracks`}
        </span>
        {query && (
          <button
            className="font-semibold text-brand hover:text-brand-strong"
            onClick={() => setQuery("")}
          >
            Clear search
          </button>
        )}
      </div>

      <ResourceState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={
          query
            ? "No courses match your search. Try another title or topic."
            : "There are no courses in the catalog yet."
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <article key={course._id} className="flex min-h-64 flex-col">
              <Panel className="flex h-full flex-col transition-colors hover:border-brand/40">
                <div className="flex items-start justify-between gap-4 border-b border-line bg-surface-subtle p-5">
                  <div className="grid size-11 shrink-0 place-items-center bg-brand-soft text-brand">
                    <BookOpen size={20} />
                  </div>
                  <Badge tone="brand">Learning track</Badge>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-lg font-semibold leading-snug">
                    {course.title || "Untitled course"}
                  </h2>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-muted">
                    {course.description || "Explore the course curriculum and build practical skills."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      to={`/courses/${course._id}`}
                      className="inline-flex min-h-10 items-center gap-2 border border-line px-3 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
                    >
                      View curriculum <ArrowRight size={15} />
                    </Link>
                    {hasSession() ? (
                      <Button
                        className="min-h-10 px-3"
                        disabled={busyCourse === course._id}
                        onClick={() => enroll(course._id)}
                      >
                        {busyCourse === course._id ? "Enrolling…" : "Enroll"}
                      </Button>
                    ) : (
                      <Link
                        to="/login"
                        className="inline-flex min-h-10 items-center bg-brand px-3 text-sm font-semibold text-white hover:bg-brand-strong"
                      >
                        Sign in to enroll
                      </Link>
                    )}
                  </div>
                </div>
              </Panel>
            </article>
          ))}
        </div>
      </ResourceState>
    </div>
  );
}
