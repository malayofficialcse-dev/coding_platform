import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/api";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale
);

export default function ExamAnalytics() {
  const { id } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get(`/exams/${id}/analytics`);
        setAnalytics(res.data);
      } catch (err) {
        setAnalytics(null);
      }
      setLoading(false);
    };
    fetchAnalytics();
  }, [id]);

  if (loading) return <p className="text-center mt-5">Loading analytics...</p>;

  if (!analytics)
    return (
      <div className="container mt-5">
        <div className="alert alert-warning text-center">
          No analytics data found for this exam.
        </div>
      </div>
    );

  const scoreData = {
    labels: ["Average", "Highest", "Lowest"],
    datasets: [
      {
        label: "Scores",
        data: [
          Number(analytics.averageScore) || 0,
          Number(analytics.highestScore) || 0,
          Number(analytics.lowestScore) || 0,
        ],
        backgroundColor: ["#36A2EB", "#4CAF50", "#FF6384"],
      },
    ],
  };

  const passFailData = {
    labels: ["Pass", "Fail"],
    datasets: [
      {
        data: [analytics.passCount, analytics.failCount],
        backgroundColor: ["#4CAF50", "#FF6384"],
      },
    ],
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center text-primary mb-4">
        {analytics.title} – Analytics
      </h2>
      <div className="row g-4">
        <div className="col-md-4">
          <div className="card shadow p-3 text-center">
            <h5>Total Attempts</h5>
            <h2>{analytics.totalAttempts}</h2>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow p-3 text-center">
            <h5>Average Score</h5>
            <h2>{analytics.averageScore}</h2>
            <div className="small text-muted">
              Out of {analytics.totalQuestions} questions
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow p-3 text-center">
            <h5>Pass Percentage</h5>
            <h2>{analytics.passPercentage}%</h2>
            <div className="small text-muted">
              Passing Marks: {analytics.passingMarks} /{" "}
              {analytics.totalQuestions}
            </div>
          </div>
        </div>
      </div>
      <div className="row mt-5">
        <div className="col-md-6">
          <div className="card shadow p-3">
            <h5 className="text-center">Score Distribution</h5>
            <Bar data={scoreData} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow p-3">
            <h5 className="text-center">Pass vs Fail</h5>
            <Doughnut data={passFailData} />
            <div className="text-center mt-2">
              <span className="badge bg-success me-2">
                Pass: {analytics.passCount}
              </span>
              <span className="badge bg-danger">
                Fail: {analytics.failCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
