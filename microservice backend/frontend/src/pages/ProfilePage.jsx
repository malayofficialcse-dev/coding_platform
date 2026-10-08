import { useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, CircleUserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { api, getItems } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useResource } from "../lib/useResource";
import { Badge, Button, PageHeading, Panel, ResourceState } from "../components/ui";

export function ProfilePage() {
  const { user: savedUser, setUser } = useAuth();
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const { data, loading, error, reload, setData } = useResource(async () => {
    const [profile, enrollments] = await Promise.all([
      api("/auth/me"),
      api("/enrollments/my"),
    ]);
    return {
      user: profile?.user || profile,
      enrollments: getItems(enrollments, ["enrollments", "data"]),
    };
  });
  const user = data?.user || savedUser;

  async function save(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    setSaving(true);
    setNotice("");
    try {
      const result = await api("/users/profile", { method: "PUT", body });
      const updatedUser = result.user || { ...user, ...body };
      localStorage.setItem("code-campus-user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setData((current) =>
        current ? { ...current, user: updatedUser } : current,
      );
      setNotice("Your profile has been updated.");
    } catch (reason) {
      setNotice(reason.message || "We couldn’t update your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeading
        eyebrow="Account"
        title="Your profile"
        description="Manage your learner details and see what you’re working on."
      />
      <ResourceState loading={loading} error={error} onRetry={reload}>
        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <Panel className="h-fit p-6">
            <div className="grid size-14 place-items-center bg-brand-soft text-brand">
              <CircleUserRound size={28} />
            </div>
            <h2 className="mt-4 text-xl font-semibold">
              {user?.name || user?.username || "Learner"}
            </h2>
            <p className="mt-1 text-sm text-muted">{user?.email}</p>
            <Badge tone="brand">{user?.role || "student"}</Badge>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-5">
              <div>
                <p className="text-xs text-muted">Active courses</p>
                <p className="mt-1 text-2xl font-semibold">
                  {data?.enrollments?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">Account</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-positive">
                  <CheckCircle2 size={15} /> Active
                </p>
              </div>
            </div>
          </Panel>

          <div className="grid gap-6">
            <Panel className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold">Personal details</h2>
              <p className="mt-1 text-sm text-muted">
                Keep your learning profile up to date.
              </p>
              {notice && (
                <p className="mt-4 border border-brand/25 bg-brand-soft px-3 py-2 text-sm text-brand">
                  {notice}
                </p>
              )}
              <form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2">
                <ProfileField label="Full name" name="name" defaultValue={user?.name || ""} />
                <ProfileField label="College" name="college" defaultValue={user?.college || ""} />
                <ProfileField label="Degree" name="degree" defaultValue={user?.degree || ""} />
                <ProfileField
                  label="Year of passing"
                  name="yearOfPassing"
                  defaultValue={user?.yearOfPassing || ""}
                />
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </form>
            </Panel>

            <Panel className="p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">My learning tracks</h2>
                  <p className="mt-1 text-sm text-muted">
                    Courses you’ve enrolled in.
                  </p>
                </div>
                <Link
                  to="/courses"
                  className="text-sm font-semibold text-brand hover:text-brand-strong"
                >
                  Browse
                </Link>
              </div>
              {data?.enrollments?.length ? (
                <div className="grid gap-2">
                  {data.enrollments.map((enrollment) => {
                    const course = enrollment.courseId || enrollment.course || {};
                    return (
                      <Link
                        key={enrollment._id}
                        to={`/courses/${course._id || course}`}
                        className="flex items-center gap-3 border border-line p-3 hover:border-brand/40"
                      >
                        <BookOpen size={18} className="text-brand" />
                        <span className="flex-1 text-sm font-semibold">
                          {course.title || "Enrolled course"}
                        </span>
                        <ArrowRight size={15} className="text-muted" />
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="border border-dashed border-line p-5 text-center text-sm text-muted">
                  You haven’t enrolled in a course yet.
                </p>
              )}
            </Panel>
          </div>
        </div>
      </ResourceState>
    </div>
  );
}

function ProfileField({ label, ...props }) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <input
        className="h-10 border border-line bg-surface px-3 text-sm font-normal text-ink focus:border-brand focus:outline-none"
        {...props}
      />
    </label>
  );
}
