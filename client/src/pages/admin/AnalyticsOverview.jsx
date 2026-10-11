import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";
import { exportToExcel } from "../../utils/excelExport";
import ExportExcelButton from "../../components/ExportExcelButton";

export default function AnalyticsOverview() {
  const [exams, setExams] = useState([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/exams");
        setExams(res.data || []);
      } catch (err) {
        alert("Failed to load exams");
      }
    })();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Try to fetch individual exam analytics summaries in parallel
      const enrichedExams = await Promise.all(
        exams.map(async (e, idx) => {
          let stats = null;
          try {
            const res = await api.get(`/exams/${e._id}/analytics`);
            stats = res.data;
          } catch (err) {
            // fallback
          }

          return {
            "S.No": idx + 1,
            "Exam Title": e.title || "N/A",
            "Description": e.description || "N/A",
            "Questions Count": Array.isArray(e.questions) ? e.questions.length : 0,
            "Duration (Minutes)": e.duration || 0,
            "Total Attempts": stats?.totalAttempts ?? "N/A",
            "Average Score": stats?.averageScore ?? "N/A",
            "Pass Percentage": stats?.passPercentage !== undefined ? `${stats.passPercentage}%` : "N/A",
            "Pass Count": stats?.passCount ?? "N/A",
            "Fail Count": stats?.failCount ?? "N/A",
            "Exam ID": e._id,
          };
        })
      );

      exportToExcel({
        filename: "Exams_Analytics_Overview",
        sheetName: "Exam Analytics",
        data: enrichedExams,
      });
    } catch (err) {
      alert("Failed to export analytics to Excel: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h2 className="fw-bold text-primary m-0">Exam Analytics</h2>
        <ExportExcelButton
          onClick={handleExport}
          loading={exporting}
          disabled={exams.length === 0}
          label="Export All Analytics"
          title="Export analytics overview for all exams to Excel"
        />
      </div>

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
                  <span className="badge bg-info">{e.questions?.length || 0}</span>
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
