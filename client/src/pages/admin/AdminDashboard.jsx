import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import { exportToExcel } from "../../utils/excelExport";
import ExportExcelButton from "../../components/ExportExcelButton";

export default function AdminDashboard() {
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.get("/exams").then((res) => setExams(res.data || [])).catch(() => {});
    api.get("/courses").then((res) => setCourses(res.data || [])).catch(() => {});
  }, []);

  const handleExportAll = () => {
    setExporting(true);
    try {
      const examsData = exams.map((e, idx) => ({
        "S.No": idx + 1,
        "Exam Title": e.title || "N/A",
        "Description": e.description || "N/A",
        "Duration (Minutes)": e.duration || 0,
        "Questions Count": Array.isArray(e.questions) ? e.questions.length : 0,
        "Status": e.isPublished ? "Published" : "Draft",
        "Created At": e.createdAt ? new Date(e.createdAt).toLocaleString() : "N/A",
        "Exam ID": e._id,
      }));

      const coursesData = courses.map((c, idx) => ({
        "S.No": idx + 1,
        "Course Title": c.title || "N/A",
        "Description": c.description || "N/A",
        "Topics Count": Array.isArray(c.topics) ? c.topics.length : 0,
        "Status": c.isPublished ? "Published" : "Draft",
        "Created At": c.createdAt ? new Date(c.createdAt).toLocaleString() : "N/A",
        "Course ID": c._id,
      }));

      exportToExcel({
        filename: "Admin_Dashboard_Overview",
        sheets: [
          { sheetName: "Exams", data: examsData },
          { sheetName: "Courses", data: coursesData },
        ],
      });
    } catch (err) {
      alert("Failed to export data to Excel: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportExams = () => {
    const data = exams.map((e, idx) => ({
      "S.No": idx + 1,
      "Exam Title": e.title || "N/A",
      "Description": e.description || "N/A",
      "Duration (Minutes)": e.duration || 0,
      "Questions Count": Array.isArray(e.questions) ? e.questions.length : 0,
      "Status": e.isPublished ? "Published" : "Draft",
      "Created At": e.createdAt ? new Date(e.createdAt).toLocaleString() : "N/A",
      "Exam ID": e._id,
    }));
    exportToExcel({
      filename: "Admin_Exams_List",
      sheetName: "Exams",
      data,
    });
  };

  const handleExportCourses = () => {
    const data = courses.map((c, idx) => ({
      "S.No": idx + 1,
      "Course Title": c.title || "N/A",
      "Description": c.description || "N/A",
      "Topics Count": Array.isArray(c.topics) ? c.topics.length : 0,
      "Status": c.isPublished ? "Published" : "Draft",
      "Created At": c.createdAt ? new Date(c.createdAt).toLocaleString() : "N/A",
      "Course ID": c._id,
    }));
    exportToExcel({
      filename: "Admin_Courses_List",
      sheetName: "Courses",
      data,
    });
  };

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h2 className="fw-bold text-primary m-0">Admin Dashboard</h2>
        <ExportExcelButton
          onClick={handleExportAll}
          loading={exporting}
          label="Export All to Excel"
          title="Export both Exams and Courses data into an Excel spreadsheet"
        />
      </div>

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

      {/* List of Exams */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h4 className="fw-bold m-0">Exams Created</h4>
          <ExportExcelButton
            size="sm"
            onClick={handleExportExams}
            disabled={exams.length === 0}
            label="Export Exams"
          />
        </div>
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
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h4 className="fw-bold m-0">Courses Created</h4>
          <ExportExcelButton
            size="sm"
            onClick={handleExportCourses}
            disabled={courses.length === 0}
            label="Export Courses"
          />
        </div>
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
