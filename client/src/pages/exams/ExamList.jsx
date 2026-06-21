import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";

export default function ExamList() {
  const [exams, setExams] = useState([]);
  const [search, setSearch] = useState("");
  useEffect(() => {
    api.get("/exams").then((res) => setExams(res.data));
  }, []);
  const filtered = exams.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.description &&
        e.description.toLowerCase().includes(search.toLowerCase()))
  );
  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">Exams</h2>
      <div className="mb-3">
        <input
          className="form-control"
          placeholder="Search exams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="row g-4">
        {filtered.length === 0 && (
          <div className="col-12 text-center text-muted">No exams found.</div>
        )}
        {filtered.map((exam) => (
          <div className="col-md-4" key={exam._id}>
            <div className="card h-100 shadow">
              <div className="card-body">
                <h5 className="fw-bold">{exam.title}</h5>
                <p className="text-muted">{exam.description}</p>
                <Link
                  to={`/take/${exam._id}`}
                  className="btn btn-primary btn-sm"
                >
                  Take Exam
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
