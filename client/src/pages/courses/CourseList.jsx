import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";
import EnrollButton from "../../components/EnrollButton";

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  useEffect(() => {
    api.get("/courses").then((res) => setCourses(res.data));
  }, []);
  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  // Only show course.image, fallback to placeholder if not valid
  const getCourseImage = (course) => {
    if (
      course.image &&
      (course.image.startsWith("http://") ||
        course.image.startsWith("https://"))
    ) {
      return course.image;
    }
    return (
      "https://ui-avatars.com/api/?name=" + encodeURIComponent(course.title)
    );
  };

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">Courses</h2>
      <div className="mb-3">
        <input
          className="form-control"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="row g-4">
        {filtered.length === 0 && (
          <div className="col-12 text-center text-muted">No courses found.</div>
        )}
        {filtered.map((course) => (
          <div className="col-md-4" key={course._id}>
            <div className="card h-100 shadow">
              <img
                src={getCourseImage(course)}
                className="card-img-top"
                alt={course.title}
                style={{ objectFit: "cover", height: 200 }}
              />
              <div className="card-body">
                <h5 className="fw-bold">{course.title}</h5>
                <p className="text-muted">{course.description}</p>
                <Link
                  to={`/courses/${course._id}`}
                  className="btn btn-primary btn-sm me-2"
                >
                  View Course
                </Link>
                <EnrollButton courseId={course._id} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
