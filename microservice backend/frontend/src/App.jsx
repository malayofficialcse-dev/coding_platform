import { useEffect, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { clearSession, getSavedUser, hasSession } from "./lib/api";
import { AppShell } from "./components/AppShell";
import { AuthContext, useAuth } from "./lib/auth";
import { DashboardPage } from "./pages/DashboardPage";
import { CoursesPage } from "./pages/CoursesPage";
import { CourseDetailPage } from "./pages/CourseDetailPage";
import { ExamsPage, ExamDetailPage, AttemptsPage } from "./pages/ExamsPage";
import { PracticePage, ProblemDetailPage } from "./pages/PracticePage";
import { CommunityPage } from "./pages/CommunityPage";
import { AuthPage } from "./pages/AuthPage";
import { ProfilePage } from "./pages/ProfilePage";
import { MessagesPage } from "./pages/MessagesPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { AdminDashboardPage, AdminCourseCreatePage, AdminExamCreatePage } from "./pages/AdminPages";

function RequireAuth({ children }) {
  const location = useLocation();
  if (!hasSession()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

export default function App() {
  const [user, setUser] = useState(getSavedUser);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("code-campus-theme") || "light",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("code-campus-theme", theme);
  }, [theme]);

  const signOut = () => {
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, signOut }}>
      <Routes>
        <Route element={<AppShell theme={theme} onThemeChange={setTheme} />}>
          <Route index element={<DashboardPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="courses/:id" element={<CourseDetailPage />} />
          <Route path="exams" element={<ExamsPage />} />
          <Route path="exams/:id" element={<Protected><ExamDetailPage /></Protected>} />
          <Route path="attempts" element={<Protected><AttemptsPage /></Protected>} />
          <Route path="practice" element={<PracticePage />} />
          <Route path="practice/:id" element={<Protected><ProblemDetailPage /></Protected>} />
          <Route path="community" element={<CommunityPage />} />
          <Route path="profile" element={<Protected><ProfilePage /></Protected>} />
          <Route path="messages" element={<Protected><MessagesPage /></Protected>} />
          <Route path="notifications" element={<Protected><NotificationsPage /></Protected>} />
          <Route path="admin" element={<AdminOnly><AdminDashboardPage /></AdminOnly>} />
          <Route path="admin/courses/new" element={<AdminOnly><AdminCourseCreatePage /></AdminOnly>} />
          <Route path="admin/exams/new" element={<AdminOnly><AdminExamCreatePage /></AdminOnly>} />
          <Route path="login" element={<AuthPage mode="login" />} />
          <Route path="register" element={<AuthPage mode="register" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthContext.Provider>
  );
}

function Protected({ children }) {
  return <RequireAuth>{children}</RequireAuth>;
}

function AdminOnly({ children }) {
  const { user } = useAuth();
  return user?.role === "admin" ? (
    children
  ) : (
    <Navigate to={user ? "/" : "/login"} replace />
  );
}
