import React, { useEffect, useState, useContext } from "react";
import api from "../../api/api";
import { Link } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";

const DSA_TOPICS = [
  "Basic",
  "Array",
  "Matrix",
  "String",
  "TwoPointers",
  "SlidingWindow",
  "PrefixSum",
  "LinkedList",
  "DoublyLinkedList",
  "CircularLinkedList",
  "Stack",
  "Queue",
  "Deque",
  "PriorityQueue",
  "HashMap",
  "HashSet",
  "Tree",
  "BinaryTree",
  "BST",
  "Trie",
  "SegmentTree",
  "Heap",
  "DisjointSetUnion",
  "Graph",
  "DP",
  "BinarySearch",
  "SearchAlgorithms",
  "Sorting",
  "Recursion",
  "Greedy",
  "Backtracking",
  "DivideAndConquer",
  "BitManipulation",
];

export function CodingProblems() {
  const [problems, setProblems] = useState([]);
  const [difficulty, setDifficulty] = useState("");
  const [dsaTopic, setDsaTopic] = useState("");
  const [solvedIds, setSolvedIds] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    api
      .get(`/coding/problems?difficulty=${difficulty}&dsaTopic=${dsaTopic}`)
      .then((res) => setProblems(res.data));
  }, [difficulty, dsaTopic]);

  useEffect(() => {
    if (user) {
      api.get("/coding/submissions/me").then((res) => {
        const solved = res.data
          .filter((s) => s.result === "Accepted")
          .map((s) => s.problem);
        setSolvedIds([...new Set(solved)]);
      });
    } else {
      setSolvedIds([]); // If not logged in, no solved problems
    }
  }, [user]);

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-3">Coding Problems</h2>
      <div className="mb-3 d-flex gap-2 flex-wrap">
        <select
          className="form-select w-auto"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="">All Difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select
          className="form-select w-auto"
          value={dsaTopic}
          onChange={(e) => setDsaTopic(e.target.value)}
        >
          <option value="">All Topics</option>
          {DSA_TOPICS.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5">
        <h4 className="fw-bold mb-2">DSA Topics</h4>
        <div className="d-flex flex-wrap gap-2">
          {DSA_TOPICS.map((topic) => (
            <button
              key={topic}
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setDsaTopic(topic)}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>
      <div className="row">
        {problems.map((p) => (
          <div className="col-md-6 col-lg-4 mb-3" key={p._id}>
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h5 className="fw-bold">
                  {p.title}
                  {solvedIds.includes(p._id) && (
                    <span className="badge bg-success ms-2">Solved</span>
                  )}
                </h5>
                <div>
                  <span
                    className={`badge me-2 bg-${
                      p.difficulty === "easy"
                        ? "success"
                        : p.difficulty === "medium"
                        ? "warning"
                        : "danger"
                    }`}
                  >
                    {p.difficulty}
                  </span>
                  <span className="badge bg-info">{p.dsaTopic}</span>
                </div>
                <Link
                  to={`/coding/problems/${p._id}`}
                  className="btn btn-primary btn-sm mt-3 w-100"
                >
                  Solve
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
