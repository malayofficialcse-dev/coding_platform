import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const PIE_COLORS = [
  "#4F8A8B",
  "#FBD46D",
  "#F76B8A",
  "#A3DE83",
  "#374785",
  "#24305E",
  "#F8E9A1",
  "#F76C6C",
  "#A8D8EA",
  "#AA96DA",
  "#FCBAD3",
  "#FFFFD2",
  "#B8F2E6",
  "#F67280",
];

export default function CodingAnalytics() {
  const [submissions, setSubmissions] = useState([]);
  const [problems, setProblems] = useState([]);
  const [topics, setTopics] = useState({});

  useEffect(() => {
    api.get("/coding/submissions/me").then((res) => setSubmissions(res.data));
    api.get("/coding/problems").then((res) => {
      setProblems(res.data);
      const topicMap = {};
      res.data.forEach((p) => {
        topicMap[p._id] = p.dsaTopic;
      });
      setTopics(topicMap);
    });
  }, []);

  // Analytics calculations
  const solved = submissions.filter((s) => s.result === "Accepted");
  const wrong = submissions.filter((s) => s.result === "Wrong Answer");

  // Problems solved by topic
  const solvedTopics = {};
  solved.forEach((s) => {
    const topic = topics[s.problem];
    if (topic) solvedTopics[topic] = (solvedTopics[topic] || 0) + 1;
  });

  // Pie chart for solved topics
  const pieLabels = Object.keys(solvedTopics);
  const pieData = {
    labels: pieLabels,
    datasets: [
      {
        data: Object.values(solvedTopics),
        backgroundColor: PIE_COLORS.slice(0, pieLabels.length),
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };

  // Bar chart for solved by topic
  const barData = {
    labels: Object.keys(solvedTopics),
    datasets: [
      {
        label: "Solved",
        data: Object.values(solvedTopics),
        backgroundColor: "#4F8A8B",
      },
    ],
  };

  // Line chart for submissions over time
  const sortedSubs = [...submissions].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );
  const lineLabels = sortedSubs.map((s) =>
    new Date(s.createdAt).toLocaleDateString()
  );
  const lineSolved = [];
  let solvedCount = 0;
  sortedSubs.forEach((s) => {
    if (s.result === "Accepted") solvedCount++;
    lineSolved.push(solvedCount);
  });
  const lineData = {
    labels: lineLabels,
    datasets: [
      {
        label: "Total Solved",
        data: lineSolved,
        fill: false,
        borderColor: "#374785",
        backgroundColor: "#F76B8A",
        tension: 0.2,
        pointRadius: 4,
        pointBackgroundColor: "#FBD46D",
      },
    ],
  };

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4" style={{ color: "#374785" }}>
        My Coding Analytics
      </h2>
      <div className="row mb-4">
        <div className="col-md-6 mb-3">
          <div className="card p-3 shadow" style={{ background: "#f8f9fa" }}>
            <h5 className="fw-bold mb-3" style={{ color: "#4F8A8B" }}>
              Solved Topics Distribution
            </h5>
            <Pie
              data={pieData}
              options={{
                plugins: {
                  legend: {
                    display: true,
                    position: "bottom",
                    labels: { color: "#374785", font: { size: 14 } },
                  },
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        const label = context.label || "";
                        const value = context.parsed || 0;
                        return `${label}: ${value} solved`;
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>
        <div className="col-md-6 mb-3">
          <div className="card p-3 shadow" style={{ background: "#f8f9fa" }}>
            <h5 className="fw-bold mb-3" style={{ color: "#4F8A8B" }}>
              Solved by Topic (Bar)
            </h5>
            <Bar
              data={barData}
              options={{
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  x: { ticks: { color: "#374785" } },
                  y: { ticks: { color: "#374785" }, beginAtZero: true },
                },
              }}
            />
          </div>
        </div>
      </div>
      <div className="row mb-4">
        <div className="col-md-12 mb-3">
          <div className="card p-3 shadow" style={{ background: "#f8f9fa" }}>
            <h5 className="fw-bold mb-3" style={{ color: "#4F8A8B" }}>
              Progress Over Time
            </h5>
            <Line
              data={lineData}
              options={{
                plugins: {
                  legend: {
                    display: true,
                    labels: { color: "#374785", font: { size: 14 } },
                  },
                },
                scales: {
                  x: { ticks: { color: "#374785" } },
                  y: { ticks: { color: "#374785" }, beginAtZero: true },
                },
              }}
            />
          </div>
        </div>
      </div>
      <div className="mb-3">
        <h5 className="fw-bold" style={{ color: "#374785" }}>
          All Submissions
        </h5>
        <table className="table table-bordered table-striped">
          <thead className="table-dark">
            <tr>
              <th>Problem</th>
              <th>Language</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s._id}>
                <td>
                  {problems.find((p) => p._id === s.problem)?.title ||
                    s.problem}
                </td>
                <td>{s.language}</td>
                <td>
                  <span
                    className={
                      s.result === "Accepted"
                        ? "badge bg-success"
                        : "badge bg-danger"
                    }
                  >
                    {s.result}
                  </span>
                </td>
                <td>{new Date(s.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
