import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export function EnrollButton({
  courseId,
  isEnrolled: propIsEnrolled,
  isExpired: propIsExpired,
  className = "",
  size = "sm",
}) {
  const { user } = useContext(AuthContext);
  const nav = useNavigate();
  const [internalEnrolled, setInternalEnrolled] = useState(null);
  const [internalExpired, setInternalExpired] = useState(false);

  const isAdmin = user && ["admin", "super_admin"].includes(user.role);

  // If props aren't provided explicitly, auto-check when user is logged in and not admin
  useEffect(() => {
    if (propIsEnrolled !== undefined) {
      setInternalEnrolled(propIsEnrolled);
      setInternalExpired(!!propIsExpired);
      return;
    }

    if (!user || isAdmin) return;

    let isMounted = true;
    api
      .get("/enrollments/my")
      .then((res) => {
        if (!isMounted) return;
        const match = (res.data || []).find((e) => {
          const cId = e.course?._id || e.course;
          return String(cId) === String(courseId);
        });
        if (match) {
          setInternalEnrolled(true);
          setInternalExpired(match.expiresAt ? new Date(match.expiresAt) < new Date() : false);
        } else {
          setInternalEnrolled(false);
          setInternalExpired(false);
        }
      })
      .catch(() => {
        if (isMounted) setInternalEnrolled(false);
      });

    return () => {
      isMounted = false;
    };
  }, [courseId, user, isAdmin, propIsEnrolled, propIsExpired]);

  const enrolled = propIsEnrolled !== undefined ? propIsEnrolled : internalEnrolled;
  const expired = propIsExpired !== undefined ? propIsExpired : internalExpired;

  // Case 1: Admin or Super Admin
  if (isAdmin) {
    return (
      <button
        type="button"
        className={`btn btn-primary btn-${size} ${className}`}
        onClick={() => nav(`/courses/${courseId}`)}
        title="Admin access: Open course"
      >
        Go to Course &rarr;
      </button>
    );
  }

  // Case 2: Actively Enrolled
  if (enrolled && !expired) {
    return (
      <button
        type="button"
        className={`btn btn-success btn-${size} ${className}`}
        onClick={() => nav(`/courses/${courseId}`)}
        title="You are enrolled in this course"
      >
        Enrolled &rarr;
      </button>
    );
  }

  // Case 3: Enrolled but expired
  if (enrolled && expired) {
    return (
      <button
        type="button"
        className={`btn btn-warning btn-${size} ${className}`}
        onClick={() => nav(`/enroll/${courseId}`)}
        title="Your access expired. Click to renew."
      >
        Renew Access
      </button>
    );
  }

  // Case 4: Not Enrolled
  return (
    <button
      type="button"
      className={`btn btn-outline-primary btn-${size} ${className}`}
      onClick={() => {
        if (!user) nav("/login");
        else nav(`/enroll/${courseId}`);
      }}
    >
      Enroll Now
    </button>
  );
}

export default EnrollButton;
