import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { AuthContext } from "../../contexts/AuthContext";

export default function EnrollCourse() {
  const { id } = useParams(); // courseId
  const [course, setCourse] = useState(null);
  const [days, setDays] = useState(90);
  const [loading, setLoading] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
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

  // Pre-check: if already enrolled, redirect straight to the course
  useEffect(() => {
    if (!user) return;
    api
      .get("/enrollments/mine")
      .then((res) => {
        const alreadyEnrolled = res.data.find(
          (e) => e.course && String(e.course._id) === String(id)
        );
        if (alreadyEnrolled) {
          nav(`/courses/${id}`);
        }
      })
      .catch(() => {})
      .finally(() => setCheckingEnrollment(false));
  }, [user, id, nav]);

  const enroll = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/enrollments", { courseId: id, days });
      nav(`/courses/${id}`);
    } catch (err) {
      const message = err.response?.data?.error || "Enrollment failed";
      if (message === "Already enrolled") {
        // Safety net: just navigate to the course
        nav(`/courses/${id}`);
      } else {
        alert(message);
      }
    }
    setLoading(false);
  };

  if (!user) return null;
  if (checkingEnrollment) return <div className="container py-5 text-center"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Checking enrollment...</span></div></div>;

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

