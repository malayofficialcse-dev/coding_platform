import React, { useEffect, useState } from "react";
import api from "../../api/api";

function MyAttempts() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/attempts/my")
      .then((res) => setAttempts(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <div className="mt-2">Loading...</div>
      </div>
    );

  return (
    <div className="container py-4">
      <h2 className="mb-4 text-center fw-bold text-primary">
        My Exam Attempts
      </h2>
      <div className="table-responsive">
        <table className="table table-bordered table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Exam</th>
              <th>Score</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((attempt) => (
              <tr key={attempt._id}>
                <td>{attempt.exam?.title || "N/A"}</td>
                <td>
                  <span className="badge bg-success">{attempt.score}</span>
                </td>
                <td>{new Date(attempt.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MyAttempts;
