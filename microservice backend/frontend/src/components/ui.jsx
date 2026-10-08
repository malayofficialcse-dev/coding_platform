import { AlertCircle, LoaderCircle, RefreshCw } from "lucide-react";

export function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-[2rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Panel({ children, className = "" }) {
  return (
    <section
      className={`border border-line bg-surface shadow-[var(--cc-shadow)] ${className}`}
    >
      {children}
    </section>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}) {
  const variants = {
    primary:
      "bg-brand text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60",
    secondary:
      "border border-line bg-surface text-ink hover:border-brand hover:text-brand",
    subtle: "text-muted hover:bg-surface-subtle hover:text-ink",
    danger:
      "border border-negative/30 bg-negative/10 text-negative hover:bg-negative/15",
  };

  return (
    <button
      type={type}
      className={`inline-flex min-h-10 items-center justify-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({ children, tone = "neutral", className = "" }) {
  const tones = {
    neutral: "bg-surface-subtle text-muted",
    brand: "bg-brand-soft text-brand",
    positive: "bg-positive/10 text-positive",
    warning: "bg-warning/10 text-warning",
    negative: "bg-negative/10 text-negative",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-1 text-xs font-semibold capitalize ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function ResourceState({ loading, error, onRetry, empty, children }) {
  if (loading) {
    return (
      <Panel className="flex min-h-52 flex-col items-center justify-center gap-3 p-8 text-muted">
        <LoaderCircle className="animate-spin text-brand" size={24} />
        <span>Loading your workspace…</span>
      </Panel>
    );
  }
  if (error) {
    return (
      <Panel className="flex min-h-52 flex-col items-center justify-center gap-3 p-8 text-center">
        <AlertCircle className="text-negative" size={24} />
        <p className="max-w-xl text-sm text-ink">{error}</p>
        <Button variant="secondary" onClick={onRetry}>
          <RefreshCw size={15} /> Try again
        </Button>
      </Panel>
    );
  }
  if (empty) {
    return (
      <Panel className="flex min-h-52 flex-col items-center justify-center gap-2 p-8 text-center">
        <div className="text-sm font-semibold text-ink">Nothing here yet</div>
        <p className="max-w-md text-sm text-muted">{empty}</p>
      </Panel>
    );
  }
  return children;
}

export function TextField({ label, className = "", ...props }) {
  return (
    <label className={`grid gap-2 text-sm font-medium text-ink ${className}`}>
      {label}
      <input
        className="min-h-10 w-full border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none"
        {...props}
      />
    </label>
  );
}
