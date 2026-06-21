import React from "react";
import { Link } from "react-router-dom";
import Misson from "../assets/Mission.png"

export default function AboutPage() {
  return (
    <div style={{ background: "#f8f9fa", minHeight: "100vh" }}>
      {/* HERO SECTION */}
      <section
        style={{
          padding: "80px 20px",
          textAlign: "center",
          background:
            "linear-gradient(to right, #007bff, #6610f2)",
          color: "white",
        }}
      >
        <h1 style={{ fontSize: 42, fontWeight: 800 }}>About Code Campus</h1>
        <p style={{ maxWidth: 700, margin: "15px auto", fontSize: 18 }}>
          A modern e-learning and coding platform offering Q&A communities,
          courses, online exams, coding challenges, real-time chat, and more —
          built for students, developers, and tech enthusiasts.
        </p>
      </section>

      {/* FEATURES SECTION */}
      <section className="container py-5">
        <h2 className="fw-bold text-center mb-4">Our Core Features</h2>

        <div className="row g-4">
          {/* Feature 1 */}
          <div className="col-md-4">
            <div
              style={{
                background: "white",
                padding: 20,
                borderRadius: 14,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                height: "100%",
              }}
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                alt=""
                style={{ width: 80, marginBottom: 15 }}
              />
              <h4 className="fw-bold">Q&A Discussion Feed</h4>
              <p className="text-muted">
                Ask questions, answer others, share concepts & collaborate with
                the community in real time.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="col-md-4">
            <div
              style={{
                background: "white",
                padding: 20,
                borderRadius: 14,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                height: "100%",
              }}
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/3135/3135800.png"
                alt=""
                style={{ width: 80, marginBottom: 15 }}
              />
              <h4 className="fw-bold">Online Exams</h4>
              <p className="text-muted">
                Attempt structured tests with timers, instant scoring, and
                performance analytics.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="col-md-4">
            <div
              style={{
                background: "white",
                padding: 20,
                borderRadius: 14,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                height: "100%",
              }}
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/201/201623.png"
                alt=""
                style={{ width: 80, marginBottom: 15 }}
              />
              <h4 className="fw-bold">Courses</h4>
              <p className="text-muted">
                Explore beginner-friendly and advanced tech courses crafted to
                boost real-world skills.
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="col-md-4">
            <div
              style={{
                background: "white",
                padding: 20,
                borderRadius: 14,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                height: "100%",
              }}
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/2549/2549900.png"
                alt=""
                style={{ width: 80, marginBottom: 15 }}
              />
              <h4 className="fw-bold">Coding Problems</h4>
              <p className="text-muted">
                Practice coding with structured DSA challenges and interactive
                problem-solving.
              </p>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="col-md-4">
            <div
              style={{
                background: "white",
                padding: 20,
                borderRadius: 14,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                height: "100%",
              }}
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/2645/2645897.png"
                alt=""
                style={{ width: 80, marginBottom: 15 }}
              />
              <h4 className="fw-bold">Real-Time Messages</h4>
              <p className="text-muted">
                Chat instantly with friends, classmates, or mentors using our
                real-time messaging system.
              </p>
            </div>
          </div>

          {/* Feature 6 */}
          <div className="col-md-4">
            <div
              style={{
                background: "white",
                padding: 20,
                borderRadius: 14,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                height: "100%",
              }}
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/1077/1077063.png"
                alt=""
                style={{ width: 80, marginBottom: 15 }}
              />
              <h4 className="fw-bold">Follow / Unfollow</h4>
              <p className="text-muted">
                Connect with fellow developers and stay updated with their
                activities & posts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* OUR MISSION */}
      <section
        style={{
          background: "white",
          padding: "60px 20px",
        }}
      >
        <div className="container">
          <h2 className="fw-bold text-center mb-4">Our Mission</h2>

          <div className="row align-items-center">
            <div className="col-md-6">
              <p style={{ fontSize: 17, color: "#555", lineHeight: 1.7 }}>
                At Code Campus, our mission is to make learning accessible,
                engaging, and practical for every student, irrespective of their
                background. We aim to build an ecosystem where learning,
                collaboration, problem-solving, and mentorship merge into a
                unified experience.
              </p>
              <p style={{ fontSize: 17, color: "#555", lineHeight: 1.7 }}>
                With interactive features like Q&A feeds, real-time messaging,
                coding challenges, exams, and course content — we empower
                students to grow confidently in the tech world.
              </p>
            </div>

            <div className="col-md-6 text-center">
              <img
              src={Misson}
                alt="Mission"
                style={{
                  width: "100%",
                  maxWidth: 450,
                  borderRadius: 14,
                  boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section
        style={{
          padding: "60px 20px",
          textAlign: "center",
          background: "#f1f3f5",
        }}
      >
        <h2 className="fw-bold">Join Code Campus Today</h2>
        <p className="text-muted" style={{ maxWidth: 600, margin: "10px auto" }}>
          Kickstart your learning journey — explore courses, test your skills,
          solve problems, and grow with the community!
        </p>

        <Link
          to="/signup"
          className="btn btn-primary btn-lg mt-3"
          style={{ padding: "10px 28px" }}
        >
          Create an Account
        </Link>
      </section>
    </div>
  );
}
