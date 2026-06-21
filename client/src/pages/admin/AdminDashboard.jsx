import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";

export default function AdminDashboard() {
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api.get("/exams").then((res) => setExams(res.data));
    api.get("/courses").then((res) => setCourses(res.data));
  }, []);

  return (
    <div className="container py-4">
      <h2 className="fw-bold text-center mb-4 text-primary">Admin Dashboard</h2>
      <div className="row g-4 justify-content-center mb-4">
        <div className="col-md-4 col-12">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body d-flex flex-column align-items-center justify-content-center">
              <Link
                to="/admin/exams"
                className="btn btn-primary btn-lg w-100 mb-2"
              >
                Manage Exams
              </Link>
              <Link
                to="/admin/create"
                className="btn btn-success btn-lg w-100 mb-2"
              >
                Create New Exam
              </Link>
              <Link
                to="/admin/analytics"
                className="btn btn-warning btn-lg w-100"
              >
                Exam Analytics
              </Link>
            </div>
          </div>
        </div>
        <div className="col-md-4 col-12">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body d-flex flex-column align-items-center justify-content-center">
              <Link
                to="/admin/students"
                className="btn btn-info btn-lg w-100 mb-2"
              >
                All Students
              </Link>
              <Link
                to="/admin/admins"
                className="btn btn-secondary btn-lg w-100 mb-2"
              >
                All Admins
              </Link>
              <Link to="/admin/courses" className="btn btn-info btn-lg w-100">
                Manage Courses
              </Link>
            </div>
          </div>
        </div>
        {/* Add this card for Coding Problems */}
        <div className="col-md-4 col-12">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body d-flex flex-column align-items-center justify-content-center">
              <Link
                to="/admin/coding-problems"
                className="btn btn-dark btn-lg w-100 mb-2"
              >
                Manage Coding Problems
              </Link>
              <Link
                to="/admin/post-control"
                className="btn btn-danger btn-lg w-100 mb-2"
              >
                Control All Posts
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* ...rest of your dashboard code... */}
      {/* List of Exams */}
      <div className="mb-4">
        <h4 className="fw-bold mb-2">Exams Created</h4>
        <ul className="list-group">
          {exams.length === 0 && (
            <li className="list-group-item text-muted">No exams yet.</li>
          )}
          {exams.map((exam) => (
            <li
              key={exam._id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <span>{exam.title}</span>
              <Link
                to={`/admin/exams/${exam._id}`}
                className="btn btn-outline-primary btn-sm"
              >
                Edit
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {/* List of Courses */}
      <div>
        <h4 className="fw-bold mb-2">Courses Created</h4>
        <ul className="list-group">
          {courses.length === 0 && (
            <li className="list-group-item text-muted">No courses yet.</li>
          )}
          {courses.map((course) => (
            <li
              key={course._id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <span>{course.title}</span>
              <Link
                to={`/admin/courses/${course._id}/edit`}
                className="btn btn-outline-primary btn-sm"
              >
                Edit
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
