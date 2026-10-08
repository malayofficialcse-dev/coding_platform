import { useState } from "react";
import { ArrowRight, Code2, LockKeyhole } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api, saveSession } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Button, Panel } from "../components/ui";

export function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const result = await api(`/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        body: isRegister
          ? { ...form, role: "student" }
          : { email: form.email, password: form.password },
      });
      if (!result?.token || !result?.user) {
        throw new Error("The sign-in response was incomplete. Please try again.");
      }
      saveSession(result.token, result.user);
      setUser(result.user);
      navigate(location.state?.from || "/", { replace: true });
    } catch (reason) {
      setError(reason.message || "We couldn’t sign you in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-240px)] max-w-5xl items-center gap-10 py-5 lg:grid-cols-[1fr_430px]">
      <div className="hidden lg:block">
        <div className="mb-6 grid size-14 place-items-center bg-brand text-white">
          <Code2 size={28} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          Code Campus
        </p>
        <h1 className="mt-3 max-w-xl text-4xl font-semibold leading-tight tracking-tight">
          {isRegister
            ? "Start building your next skill."
            : "Welcome back to your learning space."}
        </h1>
        <p className="mt-4 max-w-lg text-base leading-7 text-muted">
          Learn with structured courses, practice real problems, and connect
          with a community that moves you forward.
        </p>
      </div>

      <Panel className="p-6 sm:p-8">
        <div className="mb-6">
          <div className="mb-4 grid size-10 place-items-center bg-brand-soft text-brand lg:hidden">
            <Code2 size={20} />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {isRegister ? "Create your account" : "Sign in"}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {isRegister
              ? "Your learning journey starts here."
              : "Continue where you left off."}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 border border-negative/25 bg-negative/10 px-3 py-2 text-sm text-negative"
          >
            {error}
          </div>
        )}

        <form onSubmit={submit} className="grid gap-4">
          {isRegister && (
            <>
              <Field
                label="Full name"
                name="name"
                value={form.name}
                onChange={update}
                autoComplete="name"
                required
              />
              <Field
                label="Username"
                name="username"
                value={form.username}
                onChange={update}
                autoComplete="username"
                required
              />
            </>
          )}
          <Field
            label="Email address"
            name="email"
            type="email"
            value={form.email}
            onChange={update}
            autoComplete="email"
            required
          />
          <Field
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={update}
            autoComplete={isRegister ? "new-password" : "current-password"}
            minLength={6}
            required
          />
          <Button type="submit" className="mt-2 w-full" disabled={submitting}>
            <LockKeyhole size={16} />
            {submitting
              ? "Please wait…"
              : isRegister
                ? "Create account"
                : "Sign in"}
            {!submitting && <ArrowRight size={16} />}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {isRegister ? "Already have an account?" : "New to Code Campus?"}{" "}
          <Link
            to={isRegister ? "/login" : "/register"}
            className="font-semibold text-brand hover:text-brand-strong"
          >
            {isRegister ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </Panel>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <input
        className="h-11 border border-line bg-surface px-3 font-normal text-ink placeholder:text-muted focus:border-brand focus:outline-none"
        {...props}
      />
    </label>
  );
}
