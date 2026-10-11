import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
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
import { exportToExcel } from "../../utils/excelExport";
import ExportExcelButton from "../../components/ExportExcelButton";

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
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resAnalytics, resAttempts] = await Promise.allSettled([
          api.get(`/exams/${id}/analytics`),
          api.get(`/attempts/exam/${id}`),
        ]);

        if (resAnalytics.status === "fulfilled") {
          setAnalytics(resAnalytics.value.data);
        } else {
          setAnalytics(null);
        }

        if (resAttempts.status === "fulfilled" && Array.isArray(resAttempts.value.data)) {
          setAttempts(resAttempts.value.data);
        } else {
          setAttempts([]);
        }
      } catch (err) {
        setAnalytics(null);
        setAttempts([]);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleExport = () => {
    if (!analytics) return;
    setExporting(true);
    try {
      const summaryData = [
        {
          "Exam Title": analytics.title || "N/A",
          "Total Attempts": analytics.totalAttempts ?? 0,
          "Average Score": analytics.averageScore ?? 0,
          "Highest Score": analytics.highestScore ?? 0,
          "Lowest Score": analytics.lowestScore ?? 0,
          "Pass Percentage": `${analytics.passPercentage ?? 0}%`,
          "Passed Candidates": analytics.passCount ?? 0,
          "Failed Candidates": analytics.failCount ?? 0,
          "Passing Marks": analytics.passingMarks ?? 0,
          "Total Questions": analytics.totalQuestions ?? 0,
          "Exam ID": id,
        },
      ];

      const attemptsData = attempts.map((a, idx) => {
        const studentScore = a.score ?? 0;
        const totalQ = analytics.totalQuestions || 1;
        const pct = ((studentScore / totalQ) * 100).toFixed(1);
        const isPass = studentScore >= (analytics.passingMarks || 0);

        return {
          "S.No": idx + 1,
          "Student Name": a.user?.name || a.user?.username || "N/A",
          "Student Email": a.user?.email || "N/A",
          "Score": studentScore,
          "Out of": analytics.totalQuestions,
          "Percentage": `${pct}%`,
          "Result": isPass ? "PASS" : "FAIL",
          "Warnings Count": a.warningsCount || 0,
          "Auto Submitted": a.autoSubmitted ? "Yes" : "No",
          "Cheating Flagged": a.cheatingLogged ? "Yes" : "No",
          "Submitted On": a.createdAt ? new Date(a.createdAt).toLocaleString() : "N/A",
          "Attempt ID": a._id,
        };
      });

      const sanitizedTitle = (analytics.title || "Exam").replace(/\s+/g, "_");

      exportToExcel({
        filename: `${sanitizedTitle}_Full_Analytics`,
        sheets: [
          { sheetName: "Analytics Summary", data: summaryData },
          {
            sheetName: "Candidate Results",
            data: attemptsData.length > 0 ? attemptsData : [{ "Notice": "No candidate attempts recorded yet" }],
          },
        ],
      });
    } catch (err) {
      alert("Failed to export analytics to Excel: " + err.message);
    } finally {
      setExporting(false);
    }
  };

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
    <div className="container mt-4 mb-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <Link to="/admin/analytics" className="text-decoration-none small text-muted">
            &larr; Back to All Analytics
          </Link>
          <h2 className="text-primary m-0 fw-bold">
            {analytics.title} — Analytics
          </h2>
        </div>
        <ExportExcelButton
          onClick={handleExport}
          loading={exporting}
          label="Export Analytics to Excel"
          title="Export analytics summary & student candidate attempts"
        />
      </div>

      <div className="row g-4">
        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-3 text-center">
            <h5>Total Attempts</h5>
            <h2 className="fw-bold text-primary">{analytics.totalAttempts}</h2>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-3 text-center">
            <h5>Average Score</h5>
            <h2 className="fw-bold text-info">{analytics.averageScore}</h2>
            <div className="small text-muted">
              Out of {analytics.totalQuestions} questions
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-3 text-center">
            <h5>Pass Percentage</h5>
            <h2 className="fw-bold text-success">{analytics.passPercentage}%</h2>
            <div className="small text-muted">
              Passing Marks: {analytics.passingMarks} / {analytics.totalQuestions}
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4 g-4">
        <div className="col-md-6">
          <div className="card shadow-sm border-0 p-3">
            <h5 className="text-center mb-3">Score Distribution</h5>
            <Bar data={scoreData} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm border-0 p-3">
            <h5 className="text-center mb-3">Pass vs Fail</h5>
            <div style={{ maxHeight: "260px" }} className="d-flex justify-content-center">
              <Doughnut data={passFailData} />
            </div>
            <div className="text-center mt-3">
              <span className="badge bg-success me-2 px-3 py-2">
                Pass: {analytics.passCount}
              </span>
              <span className="badge bg-danger px-3 py-2">
                Fail: {analytics.failCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Attempts Table if available */}
      {attempts.length > 0 && (
        <div className="card shadow-sm border-0 mt-5 p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold m-0">Student Submissions ({attempts.length})</h5>
            <ExportExcelButton
              size="sm"
              onClick={handleExport}
              loading={exporting}
              label="Export Results"
            />
          </div>
          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Score</th>
                  <th>Result</th>
                  <th>Warnings</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((att) => {
                  const isPass = att.score >= (analytics.passingMarks || 0);
                  return (
                    <tr key={att._id}>
                      <td className="fw-semibold">{att.user?.name || att.user?.username || "N/A"}</td>
                      <td>{att.user?.email || "N/A"}</td>
                      <td>
                        <span className="badge bg-primary">
                          {att.score} / {analytics.totalQuestions}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${isPass ? "bg-success" : "bg-danger"}`}>
                          {isPass ? "Pass" : "Fail"}
                        </span>
                      </td>
                      <td>{att.warningsCount || 0}</td>
                      <td className="small text-muted">
                        {att.createdAt ? new Date(att.createdAt).toLocaleString() : "N/A"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
