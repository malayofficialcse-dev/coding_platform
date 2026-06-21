import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { AuthContext } from "../../contexts/AuthContext";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
  prism,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [expired, setExpired] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const { user } = useContext(AuthContext);
  const nav = useNavigate();

  useEffect(() => {
    api.get(`/courses/${id}`).then((res) => setCourse(res.data));
    if (user) {
      api.get("/enrollments/mine").then((res) => {
        const found = res.data.find((e) => e.course._id === id);
        if (found) {
          setEnrolled(true);
          setExpired(new Date(found.expiresAt) < new Date());
        }
      });
    }
  }, [id, user]);

  if (!course)
    return <div className="container py-5 text-center">Loading...</div>;

  if (!user) {
    return (
      <div className="container py-5 text-center">
        <p>
          Please <a href="/login">login</a> to access this course.
        </p>
      </div>
    );
  }

  if (!enrolled) {
    return (
      <div className="container py-5 text-center">
        <p>You are not enrolled in this course.</p>
        <button
          className="btn btn-primary"
          onClick={() => nav(`/enroll/${id}`)}
        >
          Enroll Now
        </button>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="container py-5 text-center">
        <p className="text-danger">Your access to this course has expired.</p>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-lg-8 col-md-10 col-12 mx-auto">
          <div className="mb-4">
            {course.image &&
            (course.image.startsWith("http://") ||
              course.image.startsWith("https://")) ? (
              <img
                src={course.image}
                alt={course.title}
                style={{
                  maxWidth: 400,
                  maxHeight: 200,
                  objectFit: "cover",
                  borderRadius: "1rem",
                }}
                className="mb-3"
              />
            ) : null}
            <h2 className="fw-bold text-primary">{course.title}</h2>
            <p className="text-muted fs-5">{course.description}</p>

            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setDarkMode((d) => !d)}
            >
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
          {course.contents && course.contents.length > 0 ? (
            course.contents
              .sort((a, b) => a.order - b.order)
              .map((content, idx) => (
                <div key={idx} className="mb-5">
                  <div className="card shadow border-0 rounded-4">
                    <div className="card-body">
                      <h4 className="fw-bold text-info mb-3 text-center">
                        {content.title}
                      </h4>
                      {/* Carousel for images */}
                      {content.images && content.images.length > 0 && (
                        <div
                          id={`carousel-content-${idx}`}
                          className="carousel slide mb-4"
                          data-bs-ride="carousel"
                          style={{ maxWidth: 500, margin: "0 auto" }}
                        >
                          <div className="carousel-inner rounded-4">
                            {content.images.map((img, i) => (
                              <div
                                className={`carousel-item${
                                  i === 0 ? " active" : ""
                                }`}
                                key={i}
                              >
                                <img
                                  src={img}
                                  className="d-block w-100"
                                  alt={`Slide ${i + 1}`}
                                  style={{
                                    maxHeight: 300,
                                    objectFit: "contain",
                                    borderRadius: "1rem",
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          {content.images.length > 1 && (
                            <>
                              <button
                                className="carousel-control-prev"
                                type="button"
                                data-bs-target={`#carousel-content-${idx}`}
                                data-bs-slide="prev"
                              >
                                <span
                                  className="carousel-control-prev-icon"
                                  aria-hidden="true"
                                ></span>
                                <span className="visually-hidden">
                                  Previous
                                </span>
                              </button>
                              <button
                                className="carousel-control-next"
                                type="button"
                                data-bs-target={`#carousel-content-${idx}`}
                                data-bs-slide="next"
                              >
                                <span
                                  className="carousel-control-next-icon"
                                  aria-hidden="true"
                                ></span>
                                <span className="visually-hidden">Next</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                      {/* Code blocks */}
                      {content.codeBlocks &&
                        content.codeBlocks.length > 0 &&
                        content.codeBlocks.map((cb, cidx) => (
                          <div key={cidx} className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="badge bg-dark text-white">
                                {cb.language}
                              </span>
                              <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(cb.code);
                                }}
                              >
                                Copy
                              </button>
                            </div>
                            <SyntaxHighlighter
                              language={cb.language}
                              style={darkMode ? vscDarkPlus : prism}
                              showLineNumbers
                              customStyle={{
                                borderRadius: "10px",
                                fontSize: "1rem",
                                background: darkMode ? "#222" : "#f8f8f8",
                              }}
                            >
                              {cb.code}
                            </SyntaxHighlighter>
                          </div>
                        ))}
                      {/* Markdown body with react-markdown */}
                      <div
                        className="fs-5 lh-lg"
                        style={{ color: "#374151", textAlign: "left" }}
                      >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {content.body}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))
          ) : (
            <div className="alert alert-info text-center">No content yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
