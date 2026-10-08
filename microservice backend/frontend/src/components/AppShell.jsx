import { useState } from "react";
import {
  BookOpen,
  Bell,
  Code2,
  GraduationCap,
  Menu,
  MessageCircle,
  MessageSquareText,
  Moon,
  ShieldCheck,
  Sun,
  X,
} from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Button } from "./ui";

const navigation = [
  { to: "/", label: "Overview", icon: GraduationCap, end: true },
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/exams", label: "Assessments", icon: ClipboardIcon },
  { to: "/practice", label: "Practice", icon: Code2 },
  { to: "/community", label: "Community", icon: MessageSquareText },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

export function AppShell({ theme, onThemeChange }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const closeMenu = () => setMenuOpen(false);
  const activeLink = ({ isActive }) =>
    `flex items-center gap-2 border-b-2 px-2 py-5 text-sm font-semibold transition-colors ${
      isActive
        ? "border-brand text-brand"
        : "border-transparent text-muted hover:text-ink"
    }`;

  const visibleNavigation =
    user?.role === "admin"
      ? [...navigation, { to: "/admin", label: "Admin", icon: ShieldCheck }]
      : navigation;
  const links = visibleNavigation.map(({ to, label, icon: Icon, end }) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      className={activeLink}
      onClick={closeMenu}
    >
      <Icon size={17} strokeWidth={1.8} />
      {label}
    </NavLink>
  ));

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-[66px] max-w-[1440px] items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-8">
            <Link
              to="/"
              className="flex shrink-0 items-center gap-2.5 text-ink"
              onClick={closeMenu}
            >
              <span className="grid size-9 place-items-center bg-brand text-white">
                <Code2 size={20} strokeWidth={2.2} />
              </span>
              <span className="hidden text-base font-bold tracking-tight sm:block">
                Code Campus
              </span>
            </Link>
            <nav className="hidden items-center gap-2 xl:gap-4 2xl:flex">{links}</nav>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              className="grid size-10 place-items-center border border-line text-muted hover:bg-surface-subtle hover:text-ink"
              onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="hidden max-w-36 truncate px-2 text-sm font-semibold text-ink hover:text-brand sm:block"
                >
                  {user.name || user.username || "My profile"}
                </Link>
                <Button
                  variant="secondary"
                  className="hidden min-h-9 px-3 sm:inline-flex"
                  onClick={() => {
                    signOut();
                    navigate("/");
                  }}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <Link
                to="/login"
                className="hidden min-h-9 items-center bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-strong sm:inline-flex"
              >
                Sign in
              </Link>
            )}
            <button
              className="grid size-10 place-items-center border border-line text-ink lg:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
        {!menuOpen && (
          <nav className="hidden items-center gap-1 border-t border-line px-6 xl:flex 2xl:hidden">
            {links}
          </nav>
        )}
        {menuOpen && (
          <nav className="grid border-t border-line bg-surface px-4 py-2 lg:hidden">
            {links}
            {user ? (
              <Link
                to="/profile"
                className="flex items-center gap-2 py-3 text-sm font-semibold text-ink"
                onClick={closeMenu}
              >
                My profile
              </Link>
            ) : (
              <Link
                to="/login"
                className="py-3 text-sm font-semibold text-brand"
                onClick={closeMenu}
              >
                Sign in or create account
              </Link>
            )}
          </nav>
        )}
      </header>
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Outlet />
      </main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} Code Campus</span>
          <span>Learn. Build. Share.</span>
        </div>
      </footer>
    </div>
  );
}

function ClipboardIcon(props) {
  return <BookOpen {...props} />;
}
