import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { Link, useNavigate } from "react-router-dom";
import { exportToExcel } from "../../utils/excelExport";
import ExportExcelButton from "../../components/ExportExcelButton";

export default function AdminCourseList() {
  const [courses, setCourses] = useState([]);
  const [exporting, setExporting] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    api.get("/courses").then((res) => setCourses(res.data || [])).catch(() => {});
  }, []);

  const remove = async (id) => {
    if (!window.confirm("Delete this course?")) return;
    try {
      await api.delete(`/courses/${id}`);
      setCourses((c) => c.filter((x) => x._id !== id));
    } catch (err) {
      alert("Delete failed");
    }
  };

  const handleExport = () => {
    setExporting(true);
    try {
      const data = courses.map((c, idx) => ({
        "S.No": idx + 1,
        "Course Title": c.title || "N/A",
        "Description": c.description || "N/A",
        "Total Topics": Array.isArray(c.topics) ? c.topics.length : 0,
        "Topics Summary": Array.isArray(c.topics) ? c.topics.map((t) => t.title).join(", ") : "None",
        "Status": c.isPublished ? "Published" : "Draft",
        "Created At": c.createdAt ? new Date(c.createdAt).toLocaleString() : "N/A",
        "Course ID": c._id,
      }));

      exportToExcel({
        filename: "All_Courses_List",
        sheetName: "All Courses",
        data,
      });
    } catch (err) {
      alert("Failed to export courses to Excel: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h2 className="fw-bold text-primary m-0">All Courses</h2>
        <div className="d-flex gap-2">
          <ExportExcelButton
            onClick={handleExport}
            loading={exporting}
            disabled={courses.length === 0}
            label="Export to Excel"
          />
          <Link to="/admin/courses/create" className="btn btn-success">
            + Add Course
          </Link>
        </div>
      </div>
      <div className="table-responsive">
        <table className="table table-bordered table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Contents</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c._id}>
                <td>{c.title}</td>
                <td>{c.description}</td>
                <td>{c.topics?.length || 0} Topics</td>
                <td>
                  <Link
                    to={`/admin/courses/${c._id}/edit`}
                    className="btn btn-primary btn-sm me-2"
                  >
                    Edit
                  </Link>
                  <Link
                    to={`/admin/courses/${c._id}/content`}
                    className="btn btn-warning btn-sm me-2"
                  >
                    Add Content
                  </Link>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => remove(c._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-muted">
                  No courses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
