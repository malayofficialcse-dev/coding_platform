import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { AuthContext } from "../../contexts/AuthContext";

export default function EnrollCourse() {
  const { id } = useParams(); // courseId
  const [course, setCourse] = useState(null);
  const [days, setDays] = useState(90);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user) {
      nav("/login");
    }
  }, [user, nav]);

  useEffect(() => {
    api.get(`/courses/${id}`).then((res) => setCourse(res.data));
  }, [id]);

  const enroll = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/enrollments", { courseId: id, days });
      nav(`/courses/${id}`);
    } catch (err) {
      alert(err.response?.data?.error || "Enrollment failed");
    }
    setLoading(false);
  };

  if (!user) return null;

  if (!course)
    return <div className="container py-5 text-center">Loading...</div>;

  return (
    <div className="container py-5">
      <div className="card shadow p-4 mx-auto" style={{ maxWidth: 500 }}>
        <h2 className="fw-bold mb-3 text-primary">Enroll in {course.title}</h2>
        <p>{course.description}</p>
        <form onSubmit={enroll}>
          <div className="mb-3">
            <label className="form-label">Access Duration (days):</label>
            <input
              type="number"
              className="form-control"
              min={1}
              max={365}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              required
            />
            <div className="form-text">Default is 90 days.</div>
          </div>
          <button className="btn btn-success w-100" disabled={loading}>
            {loading ? "Enrolling..." : "Confirm Enrollment"}
          </button>
        </form>
      </div>
    </div>
  );
}
