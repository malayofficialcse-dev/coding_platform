import React, { useState, useEffect } from "react";
import {
  FaGraduationCap,
  FaPrint,
  FaCopy,
  FaCheck,
  FaTimes,
  FaAward,
  FaEdit,
  FaSave,
} from "react-icons/fa";
import api from "../api/api";
import "./CourseCertificate.css";

export function CourseCertificate({ certificate, onClose }) {
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  if (!certificate) return null;

  const {
    certificateNumber = "CC-2025-0789",
    certificateIssuedAt,
    studentName: initialStudentName,
    courseTitle = "Full Stack Web Development",
    ceoName = "Malay Maity",
    ceoTitle = "Founder & CEO, Code Campus",
    instructorName = "Rahul Sen",
    instructorTitle = "Course Instructor",
    enrollmentId,
  } = certificate;

  // Helper to ensure CEO name is never used as the student's name
  const isCeoName = (name) => {
    if (!name) return false;
    const clean = String(name).trim().toLowerCase();
    return clean === "malay maity" || (ceoName && clean === String(ceoName).trim().toLowerCase());
  };

  const resolvedInitial =
    initialStudentName && !isCeoName(initialStudentName)
      ? initialStudentName.trim()
      : "Student Name";

  const [studentName, setStudentName] = useState(resolvedInitial);
  const [tempName, setTempName] = useState(resolvedInitial);
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (initialStudentName && !isCeoName(initialStudentName)) {
      setStudentName(initialStudentName.trim());
      setTempName(initialStudentName.trim());
    }
  }, [initialStudentName, ceoName]);

  const formatDate = (dateInput) => {
    const d = dateInput ? new Date(dateInput) : new Date();
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(certificateNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveStudentName = async () => {
    const trimmed = tempName.trim();
    if (!trimmed) return;
    setStudentName(trimmed);
    setIsEditingName(false);

    if (enrollmentId) {
      setSavingName(true);
      try {
        await api.post(`/enrollments/${enrollmentId}/certificate`, {
          studentName: trimmed,
        });
      } catch (err) {
        console.error("Failed to persist updated certificate student name:", err);
      } finally {
        setSavingName(false);
      }
    }
  };

  return (
    <div className="cc-cert-modal-backdrop" onClick={onClose}>
      <div className="cc-cert-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Toolbar */}
        <div className="cc-cert-toolbar">
          <div className="d-flex align-items-center gap-2">
            <FaAward style={{ color: "#eab308", fontSize: "20px" }} />
            <strong style={{ fontSize: "14px" }}>Verified Certificate of Completion</strong>
            <span style={{ fontSize: "12px", color: "#8b949e" }}>({certificateNumber})</span>
          </div>
          <div className="cc-cert-toolbar-actions">
            {/* Inline Student Name Editor button */}
            {!isEditingName ? (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 text-light"
                onClick={() => {
                  setTempName(studentName);
                  setIsEditingName(true);
                }}
                title="Edit student name on certificate"
              >
                <FaEdit /> Edit Student Name
              </button>
            ) : (
              <div className="d-inline-flex align-items-center gap-1">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="Enter Student Name"
                  className="form-control form-control-sm py-0"
                  style={{ width: "160px", fontSize: "12px" }}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn btn-sm btn-success py-0"
                  onClick={handleSaveStudentName}
                  disabled={savingName}
                  title="Save Name"
                >
                  <FaSave /> Save
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light py-0"
                  onClick={() => setIsEditingName(false)}
                >
                  Cancel
                </button>
              </div>
            )}

            <button
              type="button"
              className="btn btn-sm btn-outline-light d-inline-flex align-items-center gap-2"
              onClick={handleCopyId}
            >
              {copied ? <FaCheck style={{ color: "#22c55e" }} /> : <FaCopy />}
              {copied ? "Copied ID" : "Copy Cert ID"}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary d-inline-flex align-items-center gap-2"
              onClick={handlePrint}
            >
              <FaPrint /> Print / Save as PDF
            </button>
            <button
              type="button"
              className="btn btn-sm btn-secondary d-inline-flex align-items-center"
              onClick={onClose}
              title="Close"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Certificate Canvas Frame */}
        <div className="cc-cert-canvas-wrap">
          <div className="cc-cert-canvas" id="printable-certificate">
            {/* Inset perimeter frame line */}
            <div className="cc-cert-inner-frame" />

            {/* Subtle Guilloche Flowing Sine Waves (Left & Right) */}
            <svg
              className="cc-cert-waves-left"
              viewBox="0 0 320 680"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M -40,100 C 60,180 140,240 80,380 C 20,520 180,580 260,680"
                stroke="#bae6fd"
                strokeWidth="1.2"
                fill="none"
              />
              <path
                d="M -30,120 C 70,200 150,260 90,400 C 30,540 190,600 270,700"
                stroke="#e0f2fe"
                strokeWidth="1.2"
                fill="none"
              />
              <path
                d="M -50,80 C 50,160 130,220 70,360 C 10,500 170,560 250,660"
                stroke="#e0f2fe"
                strokeWidth="1.2"
                fill="none"
              />
              <path
                d="M -20,140 C 80,220 160,280 100,420 C 40,560 200,620 280,720"
                stroke="#bae6fd"
                strokeWidth="0.8"
                fill="none"
              />
            </svg>

            <svg
              className="cc-cert-waves-right"
              viewBox="0 0 320 680"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 360,100 C 260,180 180,240 240,380 C 300,520 140,580 60,680"
                stroke="#bae6fd"
                strokeWidth="1.2"
                fill="none"
              />
              <path
                d="M 370,120 C 270,200 190,260 250,400 C 310,540 150,600 70,700"
                stroke="#e0f2fe"
                strokeWidth="1.2"
                fill="none"
              />
              <path
                d="M 350,80 C 250,160 170,220 230,360 C 290,500 130,560 50,660"
                stroke="#e0f2fe"
                strokeWidth="1.2"
                fill="none"
              />
            </svg>

            {/* Top-Left Geometric Corner Fold Ribbon (SVG matching LearnHub) */}
            <svg
              className="cc-cert-corner-tl"
              viewBox="0 0 160 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polygon points="0,0 160,0 0,160" fill="#0078d4" />
              <polygon points="0,0 120,0 0,120" fill="#0284c7" />
              <polygon points="0,0 60,0 0,60" fill="#1e3a8a" />
              <polygon points="25,0 160,0 0,160 0,25" fill="#38bdf8" fillOpacity="0.4" />
            </svg>

            {/* Bottom-Right Geometric Corner Fold Ribbon (SVG matching LearnHub) */}
            <svg
              className="cc-cert-corner-br"
              viewBox="0 0 160 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polygon points="160,160 0,160 160,0" fill="#0078d4" />
              <polygon points="160,160 40,160 160,40" fill="#0284c7" />
              <polygon points="160,160 100,160 160,100" fill="#1e3a8a" />
              <polygon points="135,160 0,160 160,0 160,135" fill="#38bdf8" fillOpacity="0.4" />
            </svg>

            {/* Top Header Bar */}
            <div className="cc-cert-topbar">
              <div className="cc-cert-brand">
                <div className="cc-cert-brand-icon">
                  <FaGraduationCap />
                </div>
                <div className="cc-cert-brand-text">
                  <h2>LearnHub</h2>
                  <span>Learn • Build • Grow</span>
                </div>
              </div>

              <div className="cc-cert-meta">
                <div>
                  Certificate No: <strong>{certificateNumber}</strong>
                </div>
                <div>
                  Issued On: <strong>{formatDate(certificateIssuedAt)}</strong>
                </div>
              </div>
            </div>

            {/* Gold Badge Ribbon Medallion */}
            <div className="cc-cert-gold-seal-wrap">
              <div className="cc-cert-gold-seal">
                <FaGraduationCap className="cc-cert-gold-seal-cap" />
                <div className="cc-cert-gold-seal-text">
                  Learn<br />Achieve<br />Succeed
                </div>
              </div>
              <div className="cc-cert-seal-ribbons">
                <div className="cc-cert-seal-ribbon left" />
                <div className="cc-cert-seal-ribbon right" />
              </div>
            </div>

            {/* Certificate Core Statement */}
            <div className="cc-cert-body">
              <h1 className="cc-cert-title-primary">Certificate</h1>
              <div className="cc-cert-title-sub-row">
                <i />
                <span>Of Completion</span>
                <i />
              </div>

              <div className="cc-cert-certify-line">This is to certify that</div>

              {/* Student Recipient Name (Never the CEO name!) */}
              <div
                className="cc-cert-recipient-name"
                onClick={() => {
                  setTempName(studentName);
                  setIsEditingName(true);
                }}
                style={{ cursor: "pointer" }}
                title="Click to edit name on certificate"
              >
                {studentName}
              </div>

              <div className="cc-cert-completed-line">has successfully completed the course</div>

              {/* Course Title */}
              <div className="cc-cert-course-name">{courseTitle}</div>

              {/* Descriptive Paragraph (NO MERN stack logos) */}
              <p className="cc-cert-description">
                This certificate acknowledges the successful completion of all course modules, assignments,
                and assessments, and demonstrates the skills and knowledge gained in the field of web development.
              </p>
            </div>

            {/* Bottom Signatures and Motivation Quote */}
            <div className="cc-cert-bottom-row">
              {/* Instructor Signature */}
              <div className="cc-cert-signature-block">
                <div className="cc-cert-signature-script">{instructorName}</div>
                <div className="cc-cert-signature-line" />
                <div className="cc-cert-signatory-name">{instructorName}</div>
                <div className="cc-cert-signatory-title">{instructorTitle}</div>
              </div>

              {/* Center Quote */}
              <div className="cc-cert-quote-block">
                Knowledge is the first step towards a brighter future.
              </div>

              {/* CEO Signature (Malay Maity) */}
              <div className="cc-cert-signature-block">
                <div className="cc-cert-signature-script">{ceoName}</div>
                <div className="cc-cert-signature-line" />
                <div className="cc-cert-signatory-name">{ceoName}</div>
                <div className="cc-cert-signatory-title">{ceoTitle}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseCertificate;
