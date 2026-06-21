import React, { useEffect, useState } from "react";
import api from "../../api/api";

export default function UserList({ type }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Fetch users
  useEffect(() => {
    (async () => {
      const url = type === "admin" ? "/admin/admins" : "/admin/users";
      const res = await api.get(url);
      setUsers(res.data);
      setFiltered(res.data);
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

  // Show user details, attempts, and enrollments in modal
  const openUserModal = async (user) => {
    setSelectedUser(user);
    setUserDetails(user);
    if (type !== "admin") {
      // Fetch attempts
      let attemptsRes = [];
      try {
        const res = await api.get(`/admin/user/${user._id}/attempts`);
        attemptsRes = res.data || [];
      } catch (e) {
        attemptsRes = [];
      }
      setAttempts(attemptsRes);

      // Fetch enrollments (courses)
      let enrollmentsRes = [];
      try {
        const res = await api.get(`/enrollments?userId=${user._id}`);
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
      <h2 className="fw-bold text-primary mb-4">
        {type === "admin" ? "All Admins" : "All Students"}
      </h2>
      <div className="mb-3 row justify-content-end">
        <div className="col-md-4 col-12">
          <input
            className="form-control"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
              <div className="modal-footer">
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
