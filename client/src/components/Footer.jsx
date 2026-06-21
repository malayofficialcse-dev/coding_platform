import React from "react";
import { FaGithub } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      className="bg-dark text-light pt-4 pb-2 mt-5"
      style={{ marginTop: "auto" }}
    >
      <div className="container">
        <div className="row gy-3 justify-content-between align-items-start">
          <div className="col-12 col-md-4 mb-3 mb-md-0">
            <span className="fw-bold fs-5">Code Campus</span> &copy;{" "}
            {new Date().getFullYear()}
            <div className="small text-secondary mt-2">
              Built with MERN for learning, practice, and assessment
            </div>
          </div>
          <div className="col-6 col-md-2">
            <div className="fw-bold mb-2">Explore</div>
            <ul className="list-unstyled mb-0">
              <li>
                <Link to="/dashboard" className="text-light text-decoration-none">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/courses" className="text-light text-decoration-none">
                  Courses
                </Link>
              </li>
              <li>
                <Link to="/exams" className="text-light text-decoration-none">
                  Exams
                </Link>
              </li>
              <li>
                <Link to="/code/problems" className="text-light text-decoration-none">
                  Coding Problems
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-light text-decoration-none">
                  Profile
                </Link>
              </li>
            </ul>
          </div>
          <div className="col-6 col-md-2">
            <div className="fw-bold mb-2">Admin</div>
            <ul className="list-unstyled mb-0">
              <li>
                <Link to="/admin/dashboard" className="text-light text-decoration-none">
                  Admin Dashboard
                </Link>
              </li>
              <li>
                <Link to="/admin/courses" className="text-light text-decoration-none">
                  Manage Courses
                </Link>
              </li>
              <li>
                <Link to="/admin/exams" className="text-light text-decoration-none">
                  Manage Exams
                </Link>
              </li>
              <li>
                <Link to="/admin/coding-problems" className="text-light text-decoration-none">
                  Manage Coding
                </Link>
              </li>
              <li>
                <Link to="/admin/users" className="text-light text-decoration-none">
                  User List
                </Link>
              </li>
            </ul>
          </div>
          <div className="col-12 col-md-4">
            <div className="fw-bold mb-2">Features</div>
            <ul className="list-unstyled mb-0">
              <li>Q&A Feed & Social Posts</li>
              <li>Course Enrollment & Progress</li>
              <li>Exam Attempts & Results</li>
              <li>Coding Practice & Submissions</li>
              <li>Plagiarism Detection</li>
              <li>Analytics & Leaderboards</li>
              <li>Admin Content Management</li>
              <li>User Following & Comments</li>
            </ul>
            <div className="mt-3">
              <a
                href="mailto:support@onlineexam.com"
                className="text-light text-decoration-none me-3"
              >
                Contact Support
              </a>
              <a
                href="https://github.com/your-repo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-light text-decoration-none"
              >
                <FaGithub className="me-1" /> GitHub
              </a>
            </div>
          </div>
        </div>
        <hr className="bg-secondary my-3" />
        <div className="text-center small">
          Made by Your Team &nbsp;|&nbsp;
          <span className="text-secondary">All rights reserved</span>
        </div>
      </div>
    </footer>
  );
}
