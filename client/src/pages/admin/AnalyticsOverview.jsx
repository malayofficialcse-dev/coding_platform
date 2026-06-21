import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";

export default function AnalyticsOverview() {
  const [exams, setExams] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/exams");
        setExams(res.data);
      } catch (err) {
        alert("Failed to load exams");
      }
    })();
  }, []);
  return (
    <div className="container py-4">
      <h2 className="fw-bold text-primary mb-4">Exam Analytics</h2>
      <div className="table-responsive">
        <table className="table table-bordered table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Questions</th>
              <th>Duration (min)</th>
              <th>Analytics</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((e) => (
              <tr key={e._id}>
                <td className="fw-semibold">{e.title}</td>
                <td className="text-muted">{e.description}</td>
                <td>
                  <span className="badge bg-info">{e.questions?.length}</span>
                </td>
                <td>
                  <span className="badge bg-warning text-dark">
                    {e.duration}
                  </span>
                </td>
                <td>
                  <Link
                    to={`/admin/exams/analytics/${e._id}`}
                    className="btn btn-warning btn-sm"
                  >
                    View Analytics
                  </Link>
                </td>
              </tr>
            ))}
            {exams.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted">
                  No exams found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
