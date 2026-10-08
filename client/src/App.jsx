import React, { lazy, Suspense } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PrivateRoute from "./components/PrivateRoute";
// import "./styles/main.css";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/auth/Login"));
const Signup = lazy(() => import("./pages/auth/Signup"));
const Profile = lazy(() => import("./pages/Profile"));
const ExamList = lazy(() => import("./pages/exams/ExamList"));
const TakeExam = lazy(() => import("./pages/exams/TakeExam"));
const Result = lazy(() => import("./pages/exams/Result"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminExamList = lazy(() => import("./pages/admin/AdminExamList"));
const CreateExam = lazy(() => import("./pages/admin/CreateExam"));
const MyAttempts = lazy(() => import("./pages/exams/MyAttempts"));
const UserList = lazy(() => import("./pages/admin/UserList"));
const ExamAnalytics = lazy(() => import("./pages/admin/ExamAnalytics"));
const AnalyticsOverview = lazy(() => import("./pages/admin/AnalyticsOverview"));
const CourseList = lazy(() => import("./pages/courses/CourseList"));
const CourseDetail = lazy(() => import("./pages/courses/CourseDetail"));
const AdminCourseList = lazy(() => import("./pages/admin/AdminCourseList"));
const AddCourse = lazy(() => import("./pages/admin/AddCourse"));
const EnrollCourse = lazy(() => import("./pages/courses/EnrollCourse"));
const AddContent = lazy(() => import("./pages/admin/AddContent"));
const AdminCourseEdit = lazy(() => import("./pages/admin/AdminCourseEdit"));
const CodingProblems = lazy(() => import("./pages/code/CodingProblems").then((module) => ({ default: module.CodingProblems })));
const SolveProblem = lazy(() => import("./pages/code/SolveProblem").then((module) => ({ default: module.SolveProblem })));
const AdminCodingProblems = lazy(() => import("./pages/admin/AdminCodingProblems").then((module) => ({ default: module.AdminCodingProblems })));
const CodingAnalytics = lazy(() => import("./pages/code/CodingAnalytics"));
const PostToProfile = lazy(() => import("./pages/PostToProfile"));
const AdminPostControl = lazy(() => import("./pages/admin/AdminPostControl"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const AboutPage = lazy(() => import("./components/AboutPage"));
const Notifications = lazy(() => import("./components/Notifications"));
// ...existing code...

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <main className="wrap" style={{ paddingTop: 20, paddingBottom: 40 }}>
          <Suspense fallback={<div className="cc-route-loading" role="status">Loading page…</div>}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/about" element ={<AboutPage/>}/>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/notifications"
              element={
                <PrivateRoute>
                  <Notifications />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/exams"
              element={
                <PrivateRoute>
                  <ExamList />
                </PrivateRoute>
              }
            />
            <Route
              path="/take/:id"
              element={
                <PrivateRoute>
                  <TakeExam />
                </PrivateRoute>
              }
            />
            <Route
              path="/result/:attemptId"
              element={
                <PrivateRoute>
                  <Result />
                </PrivateRoute>
              }
            />
            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <PrivateRoute adminOnly={true}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/exams"
              element={
                <PrivateRoute adminOnly={true}>
                  <AdminExamList />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/create"
              element={
                <PrivateRoute adminOnly={true}>
                  <CreateExam />
                </PrivateRoute>
              }
            />
            <Route
              path="/my-attempts"
              element={
                <PrivateRoute>
                  <MyAttempts />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <PrivateRoute adminOnly={true}>
                  <UserList type="student" />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/admins"
              element={
                <PrivateRoute adminOnly={true}>
                  <UserList type="admin" />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/exams/:id"
              element={
                <PrivateRoute adminOnly={true}>
                  <CreateExam />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/exams/:id/analytics"
              element={
                <PrivateRoute adminOnly={true}>
                  <ExamAnalytics />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <PrivateRoute adminOnly={true}>
                  <AnalyticsOverview />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/exams/analytics/:id"
              element={
                <PrivateRoute adminOnly={true}>
                  <ExamAnalytics />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/courses"
              element={
                <PrivateRoute adminOnly={true}>
                  <AdminCourseList />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/courses/create"
              element={
                <PrivateRoute adminOnly={true}>
                  <AddCourse />
                </PrivateRoute>
              }
            />
            {/* Add similar routes for edit and add content */}
            <Route path="/courses" element={<CourseList />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/enroll/:id" element={<EnrollCourse />} />{" "}
            <Route
              path="/admin/courses/:id/content"
              element={
                <PrivateRoute adminOnly={true}>
                  <AddContent />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/courses/:id/edit"
              element={
                <PrivateRoute adminOnly={true}>
                  <AdminCourseEdit />
                </PrivateRoute>
              }
            />
            <Route
              path="/coding"
              element={
                <PrivateRoute>
                  <CodingProblems />
                </PrivateRoute>
              }
            />
            <Route
              path="/coding/problems/:id"
              element={
                <PrivateRoute>
                  <SolveProblem />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/coding-problems"
              element={
                <PrivateRoute adminOnly={true}>
                  <AdminCodingProblems />
                </PrivateRoute>
              }
            />
            <Route
              path="/coding/analytics"
              element={
                <PrivateRoute>
                  <CodingAnalytics />
                </PrivateRoute>
              }
            />
            <Route path="/profile/:id" element={<PostToProfile />} />
            <Route
              path="/admin/post-control"
              element={
                <PrivateRoute adminOnly={true}>
                  <AdminPostControl />
                </PrivateRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <PrivateRoute>
                  <ChatPage />
                </PrivateRoute>
              }
            />
          </Routes>
          </Suspense>
        </main>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
