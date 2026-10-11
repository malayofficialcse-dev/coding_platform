import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";
import { exportToExcel } from "../../utils/excelExport";
import ExportExcelButton from "../../components/ExportExcelButton";

export default function AdminExamList() {
  const [exams, setExams] = useState([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/admin/exams");
        setExams(res.data || []);
      } catch (err) {
        alert("Failed to load exams");
      }
    })();
  }, []);

  const remove = async (id) => {
    if (!window.confirm("Delete this exam?")) return;
    try {
      await api.delete(`/admin/exams/${id}`);
      setExams((e) => e.filter((x) => x._id !== id));
    } catch (err) {
      alert("Delete failed");
    }
  };

  const handleExport = () => {
    setExporting(true);
    try {
      const data = exams.map((e, idx) => ({
        "S.No": idx + 1,
        "Title": e.title || "N/A",
        "Description": e.description || "N/A",
        "Total Questions": Array.isArray(e.questions) ? e.questions.length : 0,
        "Duration (Minutes)": e.duration || 0,
        "Status": e.isPublished ? "Published" : "Draft",
        "Created At": e.createdAt ? new Date(e.createdAt).toLocaleString() : "N/A",
        "Exam ID": e._id,
      }));

      exportToExcel({
        filename: "All_Exams_List",
        sheetName: "All Exams",
        data,
      });
    } catch (err) {
      alert("Failed to export exams to Excel: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h2 className="fw-bold text-primary m-0">All Exams</h2>
        <div className="d-flex gap-2">
          <ExportExcelButton
            onClick={handleExport}
            loading={exporting}
            disabled={exams.length === 0}
            label="Export to Excel"
          />
          <Link to="/admin/create" className="btn btn-success">
            + Create New Exam
          </Link>
        </div>
      </div>
      <div className="table-responsive">
        <table className="table table-bordered table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Questions</th>
              <th>Duration (min)</th>
              <th>Actions</th>
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
                    to={`/admin/exams/${e._id}`}
                    className="btn btn-primary btn-sm me-2"
                  >
                    Edit
                  </Link>
                  <Link
                    to={`/admin/exams/analytics/${e._id}`}
                    className="btn btn-warning btn-sm me-2"
                  >
                    Analytics
                  </Link>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => remove(e._id)}
                  >
                    Delete
                  </button>
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
