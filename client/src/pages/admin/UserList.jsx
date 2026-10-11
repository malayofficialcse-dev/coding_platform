import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { exportToExcel } from "../../utils/excelExport";
import ExportExcelButton from "../../components/ExportExcelButton";

export default function UserList({ type }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [modalExporting, setModalExporting] = useState(false);

  // Fetch users
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/users");
        const filteredUsers =
          type === "admin"
            ? res.data.filter((user) => user.role === "admin")
            : res.data.filter((user) => user.role !== "admin");
        setUsers(filteredUsers);
        setFiltered(filteredUsers);
      } catch (err) {
        console.error("Failed to load users:", err);
      }
    })();
  }, [type]);

  // Filter users by search
  useEffect(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      setFiltered(users);
    } else {
      setFiltered(
        users.filter(
          (u) =>
            (u.name && u.name.toLowerCase().includes(q)) ||
            (u.username && u.username.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q))
        )
      );
    }
  }, [search, users]);

  // Export all/filtered users to Excel
  const handleExportUsers = () => {
    setExporting(true);
    try {
      const dataToExport = filtered.length > 0 ? filtered : users;
      const data = dataToExport.map((u, idx) => ({
        "S.No": idx + 1,
        "Name": u.name || u.username || "N/A",
        "Username": u.username || "N/A",
        "Email": u.email || "N/A",
        "Role": u.role || "N/A",
        "College": u.college || "N/A",
        "Degree": u.degree || "N/A",
        "Year of Passing": u.yearOfPassing || "N/A",
        "Created At": u.createdAt ? new Date(u.createdAt).toLocaleString() : "N/A",
        "User ID": u._id,
      }));

      const sheetName = type === "admin" ? "All Admins" : "All Students";
      const filename = type === "admin" ? "Admins_List" : "Students_List";

      exportToExcel({
        filename,
        sheetName,
        data,
      });
    } catch (err) {
      alert("Failed to export users to Excel: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  // Export single user modal details, attempts and enrollments
  const handleExportUserHistory = () => {
    if (!userDetails) return;
    setModalExporting(true);
    try {
      const profileData = [
        {
          "Name": userDetails.name || userDetails.username || "N/A",
          "Email": userDetails.email || "N/A",
          "Role": userDetails.role || "N/A",
          "College": userDetails.college || "N/A",
          "Degree": userDetails.degree || "N/A",
          "Year of Passing": userDetails.yearOfPassing || "N/A",
          "User ID": userDetails._id,
        },
      ];

      const attemptsData = attempts.map((a, idx) => ({
        "S.No": idx + 1,
        "Exam Title": a.exam?.title || "N/A",
        "Score": a.score ?? 0,
        "Warnings Count": a.warningsCount || 0,
        "Auto Submitted": a.autoSubmitted ? "Yes" : "No",
        "Cheating Logged": a.cheatingLogged ? "Yes" : "No",
        "Date": a.createdAt ? new Date(a.createdAt).toLocaleString() : "N/A",
      }));

      const enrollmentsData = enrollments.map((en, idx) => ({
        "S.No": idx + 1,
        "Course Title": en.course?.title || "N/A",
        "Status": en.status || "Enrolled",
        "Enrolled Date": en.createdAt ? new Date(en.createdAt).toLocaleString() : "N/A",
      }));

      const sanitizedName = (userDetails.name || userDetails.username || "user").replace(/\s+/g, "_");

      exportToExcel({
        filename: `${sanitizedName}_Academic_History`,
        sheets: [
          { sheetName: "Profile", data: profileData },
          { sheetName: "Exam Attempts", data: attemptsData.length > 0 ? attemptsData : [{ "Status": "No attempts found" }] },
          { sheetName: "Course Enrollments", data: enrollmentsData.length > 0 ? enrollmentsData : [{ "Status": "No enrollments found" }] },
        ],
      });
    } catch (err) {
      alert("Failed to export user history to Excel: " + err.message);
    } finally {
      setModalExporting(false);
    }
  };

  // Show user details, attempts, and enrollments in modal
  const openUserModal = async (user) => {
    setSelectedUser(user);
    setUserDetails(user);
    if (type !== "admin") {
      // Fetch attempts
      let attemptsRes = [];
      try {
        const res = await api.get(`/attempts/user/${user._id}`);
        attemptsRes = res.data || [];
      } catch (e) {
        attemptsRes = [];
      }
      setAttempts(attemptsRes);

      // Fetch enrollments (courses)
      let enrollmentsRes = [];
      try {
        const res = await api.get(`/enrollments/user/${user._id}`);
        enrollmentsRes = Array.isArray(res.data) ? res.data : [];
      } catch (e) {
        enrollmentsRes = [];
      }
      setEnrollments(enrollmentsRes);
    } else {
      setAttempts([]);
      setEnrollments([]);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setUserDetails(null);
    setAttempts([]);
    setEnrollments([]);
  };

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h2 className="fw-bold text-primary m-0">
          {type === "admin" ? "All Admins" : "All Students"}
        </h2>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <input
            className="form-control"
            style={{ width: "260px" }}
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ExportExcelButton
            onClick={handleExportUsers}
            loading={exporting}
            disabled={filtered.length === 0}
            label={type === "admin" ? "Export Admins" : "Export Students"}
          />
        </div>
      </div>
      <div className="table-responsive">
        <table className="table table-bordered table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              {type !== "admin" && <th>Details</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr
                key={u._id}
                style={{ cursor: "pointer" }}
                onClick={() => openUserModal(u)}
              >
                <td className="fw-semibold">{u.name || u.username}</td>
                <td>{u.email}</td>
                <td>
                  <span className="badge bg-info text-dark">{u.role}</span>
                </td>
                {type !== "admin" && (
                  <td>
                    <button
                      className="btn btn-outline-info btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openUserModal(u);
                      }}
                    >
                      View Details
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={type === "admin" ? 3 : 4}
                  className="text-center text-muted"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for user details, attempts, and enrollments */}
      {showModal && userDetails && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{ display: "block", background: "rgba(0,0,0,0.3)" }}
          onClick={closeModal}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {userDetails.name || userDetails.username}{" "}
                  <span className="badge bg-info ms-2">{userDetails.role}</span>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Email:</strong> {userDetails.email}
                </p>
                {userDetails.college && (
                  <p>
                    <strong>College:</strong> {userDetails.college}
                  </p>
                )}
                {userDetails.degree && (
                  <p>
                    <strong>Degree:</strong> {userDetails.degree}
                  </p>
                )}
                {type !== "admin" && (
                  <>
                    <h6 className="mt-4 mb-2">Exam Attempts</h6>
                    {attempts.length === 0 ? (
                      <p className="text-muted">No attempts found.</p>
                    ) : (
                      <div className="table-responsive mb-4">
                        <table className="table table-bordered table-hover align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>Exam</th>
                              <th>Score</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attempts.map((a) => (
                              <tr key={a._id}>
                                <td>{a.exam?.title || "N/A"}</td>
                                <td>
                                  <span className="badge bg-success">
                                    {a.score}
                                  </span>
                                </td>
                                <td>
                                  {a.createdAt
                                    ? new Date(a.createdAt).toLocaleString()
                                    : ""}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <h6 className="mt-4 mb-2">Enrolled Courses</h6>
                    {enrollments.length === 0 ? (
                      <p className="text-muted">No enrolled courses found.</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-bordered table-hover align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>Course</th>
                              <th>Status</th>
                              <th>Enrolled On</th>
                            </tr>
                          </thead>
                          <tbody>
                            {enrollments.map((en) => (
                              <tr key={en._id}>
                                <td>{en.course?.title || "N/A"}</td>
                                <td>
                                  <span className="badge bg-primary">
                                    {en.status || "Enrolled"}
                                  </span>
                                </td>
                                <td>
                                  {en.createdAt
                                    ? new Date(en.createdAt).toLocaleString()
                                    : ""}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="modal-footer d-flex justify-content-between align-items-center">
                {type !== "admin" ? (
                  <ExportExcelButton
                    size="sm"
                    onClick={handleExportUserHistory}
                    loading={modalExporting}
                    label="Export Student History"
                    title="Export student's profile, attempts, and course enrollments to Excel"
                  />
                ) : <div />}
                <button
                  className="btn btn-secondary"
                  onClick={closeModal}
                  autoFocus
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal backdrop */}
      {showModal && (
        <div
          className="modal-backdrop fade show"
          style={{ zIndex: 1040 }}
        ></div>
      )}
    </div>
  );
}
