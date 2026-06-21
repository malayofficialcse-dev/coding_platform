import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { Link, useNavigate } from "react-router-dom";

export default function AdminCourseList() {
  const [courses, setCourses] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    api.get("/courses").then((res) => setCourses(res.data));
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

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-bold text-primary m-0">All Courses</h2>
        <Link to="/admin/courses/create" className="btn btn-success">
          + Add Course
        </Link>
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
                <td>{c.contents?.length || 0}</td>
                <td>
                  <Link
                    to={`/admin/courses/${c._id}/edit`}
                    className="btn btn-primary btn-sm me-2"
                  >
                    Edit
                  </Link>
                  {/* <Link
                    to={`/admin/courses/${c._id}/content`}
                    className="btn btn-warning btn-sm me-2"
                  >
                    Add Content
                  </Link> */}

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
