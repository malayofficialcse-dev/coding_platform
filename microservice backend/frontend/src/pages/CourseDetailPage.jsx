import { useState } from "react";
import { ArrowLeft, BookOpen, CheckCircle2, ChevronDown, LockKeyhole } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { api, hasSession } from "../lib/api";
import { useResource } from "../lib/useResource";
import { Badge, Button, PageHeading, Panel, ResourceState } from "../components/ui";

export function CourseDetailPage() {
  const { id } = useParams();
  const [notice, setNotice] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const { data: course, loading, error, reload } = useResource(
    () => api(`/courses/${id}`),
    [id],
  );

  async function enroll() {
    setNotice("");
    setEnrolling(true);
    try {
      await api("/enrollments/enroll", {
        method: "POST",
        body: { courseId: id },
      });
      setNotice("You’re enrolled. The course is now part of your learning plan.");
    } catch (reason) {
      setNotice(reason.message || "We couldn’t complete your enrollment.");
    } finally {
      setEnrolling(false);
    }
  }

  const topics = Array.isArray(course?.topics) ? course.topics : [];

  return (
    <div>
      <Link
        to="/courses"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-brand"
      >
        <ArrowLeft size={16} /> All courses
      </Link>
      <ResourceState loading={loading} error={error} onRetry={reload}>
        <PageHeading
          eyebrow="Course overview"
          title={course?.title || "Course"}
          description={course?.description}
          action={
            hasSession() ? (
              <Button onClick={enroll} disabled={enrolling}>
                {enrolling ? "Enrolling…" : "Enroll in course"}
              </Button>
            ) : (
              <Link
                to="/login"
                className="inline-flex min-h-10 items-center gap-2 bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-strong"
              >
                <LockKeyhole size={15} /> Sign in to enroll
              </Link>
            )
          }
        />

        {notice && (
          <div className="mb-5 border border-brand/25 bg-brand-soft px-4 py-3 text-sm text-brand">
            {notice}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Panel className="p-5 sm:p-7">
            <div className="mb-5 flex items-center gap-3 border-b border-line pb-4">
              <BookOpen className="text-brand" size={20} />
              <div>
                <h2 className="font-semibold">Course curriculum</h2>
                <p className="mt-0.5 text-xs text-muted">
                  {topics.length} {topics.length === 1 ? "module" : "modules"}
                </p>
              </div>
            </div>
            {topics.length ? (
              <div className="grid gap-3">
                {topics
                  .slice()
                  .sort((first, second) => (first.order || 0) - (second.order || 0))
                  .map((topic, index) => (
                    <details
                      key={topic._id || topic.id || topic.title}
                      className="group border border-line"
                    >
                      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 hover:bg-surface-subtle [&::-webkit-details-marker]:hidden">
                        <span className="grid size-8 shrink-0 place-items-center bg-brand-soft text-xs font-bold text-brand">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="flex-1 font-semibold">
                          {topic.title || `Module ${index + 1}`}
                        </span>
                        <Badge>{topic.subtopics?.length || 0} lessons</Badge>
                        <ChevronDown
                          size={16}
                          className="text-muted transition-transform group-open:rotate-180"
                        />
                      </summary>
                      {topic.subtopics?.length > 0 && (
                        <div className="grid border-t border-line bg-surface-subtle px-4 py-2">
                          {topic.subtopics.map((subtopic, lessonIndex) => (
                            <div
                              key={subtopic._id || subtopic.title}
                              className="flex items-center gap-3 border-b border-line py-3 last:border-0"
                            >
                              <CheckCircle2 size={15} className="text-muted" />
                              <span className="text-sm">
                                {subtopic.title || `Lesson ${lessonIndex + 1}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </details>
                  ))}
              </div>
            ) : (
              <p className="py-6 text-sm text-muted">
                The curriculum for this course is being prepared.
              </p>
            )}
          </Panel>
          <Panel className="h-fit p-5">
            <Badge tone="positive">Built for practical learning</Badge>
            <h2 className="mt-4 text-lg font-semibold">Start when you’re ready</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Enroll to add this track to your learning plan. Your course
              content and lessons are available from the curriculum above.
            </p>
            <div className="mt-5 border-t border-line pt-4 text-sm text-muted">
              Learn at your own pace
            </div>
          </Panel>
        </div>
      </ResourceState>
    </div>
  );
}
