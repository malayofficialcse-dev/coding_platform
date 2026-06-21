import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PrivateRoute from "./components/PrivateRoute";
// import "./styles/main.css";

/* pages */
import Dashboard from "./pages/Dashboard";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Profile from "./pages/Profile";
import ExamList from "./pages/exams/ExamList";
import TakeExam from "./pages/exams/TakeExam";
import Result from "./pages/exams/Result";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminExamList from "./pages/admin/AdminExamList";
import CreateExam from "./pages/admin/CreateExam";
import MyAttempts from "./pages/exams/MyAttempts";
import UserList from "./pages/admin/UserList";
import ExamAnalytics from "./pages/admin/ExamAnalytics";
import AnalyticsOverview from "./pages/admin/AnalyticsOverview";
import CourseList from "./pages/courses/CourseList";
import CourseDetail from "./pages/courses/CourseDetail";
import AdminCourseList from "./pages/admin/AdminCourseList";
import AddCourse from "./pages/admin/AddCourse";
import EnrollCourse from "./pages/courses/EnrollCourse";
import AddContent from "./pages/admin/AddContent";
import AdminCourseEdit from "./pages/admin/AdminCourseEdit";
import { CodingProblems } from "./pages/code/CodingProblems";
import { SolveProblem } from "./pages/code/SolveProblem";
import { AdminCodingProblems } from "./pages/admin/AdminCodingProblems";
import CodingAnalytics from "./pages/code/CodingAnalytics";
import PostToProfile from "./pages/PostToProfile";
import AdminPostControl from "./pages/admin/AdminPostControl";
import ChatPage from "./pages/ChatPage";
import AboutPage from "./components/AboutPage";
import Notifications from "./components/Notifications";
// ...existing code...

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <main className="wrap" style={{ paddingTop: 20, paddingBottom: 40 }}>
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
        </main>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
