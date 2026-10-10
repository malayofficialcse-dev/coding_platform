import React, { lazy, Suspense } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PrivateRoute from "./components/PrivateRoute";

const Dashboard      = lazy(() => import("./pages/Dashboard"));
const Login          = lazy(() => import("./pages/auth/Login"));
const Signup         = lazy(() => import("./pages/auth/Signup"));
const Unauthorized   = lazy(() => import("./pages/auth/Unauthorized"));
const Profile        = lazy(() => import("./pages/Profile"));
const ExamList       = lazy(() => import("./pages/exams/ExamList"));
const TakeExam       = lazy(() => import("./pages/exams/TakeExam"));
const Result         = lazy(() => import("./pages/exams/Result"));
const MyAttempts     = lazy(() => import("./pages/exams/MyAttempts"));

// ── Admin / Super Admin ──────────────────────────────────────────────────────
const AdminDashboard      = lazy(() => import("./pages/admin/AdminDashboard"));
const SuperAdminPanel     = lazy(() => import("./pages/admin/SuperAdminPanel"));
const AdminExamList       = lazy(() => import("./pages/admin/AdminExamList"));
const CreateExam          = lazy(() => import("./pages/admin/CreateExam"));
const UserList            = lazy(() => import("./pages/admin/UserList"));
const ExamAnalytics       = lazy(() => import("./pages/admin/ExamAnalytics"));
const AnalyticsOverview   = lazy(() => import("./pages/admin/AnalyticsOverview"));
const AdminCourseList     = lazy(() => import("./pages/admin/AdminCourseList"));
const AddCourse           = lazy(() => import("./pages/admin/AddCourse"));
const AddContent          = lazy(() => import("./pages/admin/AddContent"));
const AdminCourseEdit     = lazy(() => import("./pages/admin/AdminCourseEdit"));
const AdminPostControl    = lazy(() => import("./pages/admin/AdminPostControl"));
const AdminCodingProblems = lazy(() =>
  import("./pages/admin/AdminCodingProblems").then(m => ({ default: m.AdminCodingProblems }))
);

// ── Coordinator Dashboards ───────────────────────────────────────────────────
const CoordinatorDashboard = lazy(() => import("./pages/admin/CoordinatorDashboard"));

// ── Courses / Coding ─────────────────────────────────────────────────────────
const CourseList      = lazy(() => import("./pages/courses/CourseList"));
const CourseDetail    = lazy(() => import("./pages/courses/CourseDetail"));
const EnrollCourse    = lazy(() => import("./pages/courses/EnrollCourse"));
const CodingProblems  = lazy(() =>
  import("./pages/code/CodingProblems").then(m => ({ default: m.CodingProblems }))
);
const SolveProblem    = lazy(() =>
  import("./pages/code/SolveProblem").then(m => ({ default: m.SolveProblem }))
);
const CodingAnalytics = lazy(() => import("./pages/code/CodingAnalytics"));

// ── Social ────────────────────────────────────────────────────────────────────
const PostToProfile = lazy(() => import("./pages/PostToProfile"));
const ChatPage      = lazy(() => import("./pages/ChatPage"));
const AboutPage     = lazy(() => import("./components/AboutPage"));
const Notifications = lazy(() => import("./components/Notifications"));

// ── Role sets ─────────────────────────────────────────────────────────────────
const ADMIN_ROLES       = ["admin", "super_admin"];
const COORDINATOR_ROLES = ["admin", "super_admin", "exam_coordinator", "course_coordinator", "feed_coordinator"];
const EXAM_ROLES        = ["admin", "super_admin", "exam_coordinator"];
const COURSE_ROLES      = ["admin", "super_admin", "course_coordinator"];
const FEED_ROLES        = ["admin", "super_admin", "feed_coordinator"];

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <main className="wrap cc-site-main">
          <Suspense fallback={<div className="cc-route-loading" role="status">Loading page…</div>}>
            <Routes>
              {/* ── Public ── */}
              <Route path="/"        element={<Dashboard />} />
              <Route path="/about"   element={<AboutPage />} />
              <Route path="/login"   element={<Login />} />
              <Route path="/signup"  element={<Signup />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* ── Authenticated ── */}
              <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
              <Route path="/profile"       element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/profile/:id"   element={<PostToProfile />} />
              <Route path="/my-attempts"   element={<PrivateRoute><MyAttempts /></PrivateRoute>} />
              <Route path="/messages"      element={<PrivateRoute><ChatPage /></PrivateRoute>} />
              <Route path="/courses"       element={<CourseList />} />
              <Route path="/courses/:id"   element={<CourseDetail />} />
              <Route path="/enroll/:id"    element={<EnrollCourse />} />
              <Route path="/coding"        element={<PrivateRoute><CodingProblems /></PrivateRoute>} />
              <Route path="/coding/problems/:id" element={<PrivateRoute><SolveProblem /></PrivateRoute>} />
              <Route path="/coding/analytics"    element={<PrivateRoute><CodingAnalytics /></PrivateRoute>} />

              {/* ── Exams (all authenticated users can view) ── */}
              <Route path="/exams"         element={<PrivateRoute><ExamList /></PrivateRoute>} />
              <Route path="/take/:id"      element={<PrivateRoute><TakeExam /></PrivateRoute>} />
              <Route path="/result/:attemptId" element={<PrivateRoute><Result /></PrivateRoute>} />

              {/* ── Coordinator Dashboards ── */}
              <Route
                path="/coordinator"
                element={
                  <PrivateRoute roles={COORDINATOR_ROLES}>
                    <CoordinatorDashboard />
                  </PrivateRoute>
                }
              />

              {/* ── Super Admin — RBAC Control Panel ── */}
              <Route
                path="/admin/rbac"
                element={
                  <PrivateRoute roles={["super_admin"]}>
                    <SuperAdminPanel />
                  </PrivateRoute>
                }
              />

              {/* ── Admin Dashboard (admin + super_admin) ── */}
              <Route path="/admin" element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>} />

              {/* ── Exam Management ── */}
              <Route path="/admin/exams"              element={<PrivateRoute roles={EXAM_ROLES}><AdminExamList /></PrivateRoute>} />
              <Route path="/admin/create"             element={<PrivateRoute roles={EXAM_ROLES} requirePerm={{module:"exams",action:"create"}}><CreateExam /></PrivateRoute>} />
              <Route path="/admin/exams/:id"          element={<PrivateRoute roles={EXAM_ROLES} requirePerm={{module:"exams",action:"edit"}}><CreateExam /></PrivateRoute>} />
              <Route path="/admin/exams/:id/analytics"element={<PrivateRoute roles={EXAM_ROLES}><ExamAnalytics /></PrivateRoute>} />
              <Route path="/admin/exams/analytics/:id"element={<PrivateRoute roles={EXAM_ROLES}><ExamAnalytics /></PrivateRoute>} />
              <Route path="/admin/analytics"          element={<PrivateRoute roles={EXAM_ROLES}><AnalyticsOverview /></PrivateRoute>} />

              {/* ── Course Management ── */}
              <Route path="/admin/courses"             element={<PrivateRoute roles={COURSE_ROLES}><AdminCourseList /></PrivateRoute>} />
              <Route path="/admin/courses/create"      element={<PrivateRoute roles={COURSE_ROLES} requirePerm={{module:"courses",action:"create"}}><AddCourse /></PrivateRoute>} />
              <Route path="/admin/courses/:id/content" element={<PrivateRoute roles={COURSE_ROLES} requirePerm={{module:"courses",action:"edit"}}><AddContent /></PrivateRoute>} />
              <Route path="/admin/courses/:id/edit"    element={<PrivateRoute roles={COURSE_ROLES} requirePerm={{module:"courses",action:"edit"}}><AdminCourseEdit /></PrivateRoute>} />

              {/* ── Feed / Posts ── */}
              <Route path="/admin/post-control" element={<PrivateRoute roles={FEED_ROLES} requirePerm={{module:"feed",action:"delete"}}><AdminPostControl /></PrivateRoute>} />

              {/* ── Coding Problems ── */}
              <Route path="/admin/coding-problems" element={<PrivateRoute adminOnly><AdminCodingProblems /></PrivateRoute>} />

              {/* ── User Lists ── */}
              <Route path="/admin/students" element={<PrivateRoute adminOnly><UserList type="student" /></PrivateRoute>} />
              <Route path="/admin/admins"   element={<PrivateRoute adminOnly><UserList type="admin" /></PrivateRoute>} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
