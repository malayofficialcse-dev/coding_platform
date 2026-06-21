// import React, { useEffect, useState } from "react";
// import api from "../../api/api";

// const DSA_TOPICS = [
//   // Basics

//   "Recursion",

//   // Arrays & Strings
//   "Array",
//   "Matrix",
//   "String",
//   "TwoPointers",
//   "SlidingWindow",
//   "PrefixSum",

//   // Linked Lists
//   "LinkedList",
//   "DoublyLinkedList",
//   "CircularLinkedList",

//   // Stack & Queue
//   "Stack",
//   "Queue",
//   "Deque",
//   "PriorityQueue",
//   "MonotonicStack",
//   "MonotonicQueue",

//   // Hashing
//   "HashMap",
//   "HashSet",

//   // Trees
//   "Tree",
//   "BinaryTree",
//   "BST",
//   "Trie",
//   "SegmentTree",
//   "FenwickTree",
//   "Heap",
//   "DisjointSetUnion", // DSU / Union-Find

//   // Graphs
//   "Graph",
//   "BFS",
//   "DFS",
//   "TopologicalSort",
//   "ShortestPath",
//   "Dijkstra",
//   "BellmanFord",
//   "FloydWarshall",
//   "MinimumSpanningTree",
//   "Kruskal",
//   "Prim",
//   "NetworkFlow",

//   // Dynamic Programming (DP)
//   "DP",
//   "Knapsack",
//   "LCS", // Longest Common Subsequence
//   "LIS", // Longest Increasing Subsequence
//   "MatrixChainMultiplication",
//   "CoinChange",
//   "DPonTrees",
//   "DPonGraphs",
//   "BitmaskDP",

//   // Searching
//   "BinarySearch",
//   "TernarySearch",
//   "SearchAlgorithms",

//   // Sorting
//   "Sorting",
//   "MergeSort",
//   "QuickSort",
//   "HeapSort",
//   "CountingSort",
//   "RadixSort",
//   "BucketSort",

//   // Advanced Topics
//   "Greedy",
//   "Backtracking",
//   "DivideAndConquer",
//   "BitManipulation",
//   "Maths",
//   "NumberTheory",
//   "Combinatorics",
//   "GameTheory",
//   "Geometry",
// ];

// // const LANGUAGES = [
// //   { label: "Python", value: "python3" },
// //   { label: "JavaScript", value: "javascript" },
// //   { label: "Java", value: "java" },
// // ];

// // const EMPTY_BOILERPLATE = { python3: "", java: "", javascript: "" };

// const LANGUAGES = [
//   { label: "Python", value: "python3" },
//   { label: "JavaScript", value: "javascript" },
//   { label: "Java", value: "java" },
//   { label: "C++", value: "cpp" },
// ];
// // const EMPTY_BOILERPLATE = { python3: "", java: "", javascript: "", cpp: "" };

// const EMPTY_BOILERPLATE = { python3: "", java: "", javascript: "", cpp: "" };
// const EMPTY_SOLUTION = { python3: "", java: "", javascript: "", cpp: "" };

// export function AdminCodingProblems() {
//   const [problems, setProblems] = useState([]);
//   const [editing, setEditing] = useState(null);

//   const LANGUAGES = [
//     { label: "Python", value: "python3" },
//     { label: "JavaScript", value: "javascript" },
//     { label: "Java", value: "java" },
//     { label: "C++", value: "cpp" },
//   ];
//   const EMPTY_BOILERPLATE = { python3: "", java: "", javascript: "", cpp: "" };
//   const EMPTY_SOLUTION = { python3: "", java: "", javascript: "", cpp: "" };

  

//   const startEdit = (problem) => {
//     setEditing(problem?._id || null);
//     setForm(
//       problem
//         ? {
//             ...problem,
//             tags: problem.tags || [],
//             solutionCodes: {
//               ...EMPTY_SOLUTION,
//               ...(problem.solutionCodes || {}),
//             },
//             boilerplateCodes: {
//               ...EMPTY_BOILERPLATE,
//               ...(problem.boilerplateCodes || {}),
//             },
//           }
//         : {
//             title: "",
//             description: "",
//             difficulty: "easy",
//             dsaTopic: "",
//             tags: [],
//             solutionCodes: { ...EMPTY_SOLUTION },
//             boilerplateCodes: { ...EMPTY_BOILERPLATE },
//           }
//     );
//   };
//   const handleTestCaseChange = (idx, field, value) => {
//     const newCases = [...form.testCases];
//     newCases[idx][field] = value;
//     setForm({ ...form, testCases: newCases });
//   };

//   const addTestCase = () => {
//     setForm({
//       ...form,
//       testCases: [...form.testCases, { input: "", output: "", visible: false }],
//     });
//   };

//   const removeTestCase = (idx) => {
//     setForm({
//       ...form,
//       testCases: form.testCases.filter((_, i) => i !== idx),
//     });
//   };

//   const handleBoilerplateChange = (lang, value) => {
//     setForm({
//       ...form,
//       boilerplateCodes: {
//         ...form.boilerplateCodes,
//         [lang]: value,
//       },
//     });
//   };

//   const [form, setForm] = useState({
//   title: "",
//   description: "",
//   difficulty: "easy", 
//   dsaTopic: "",
//   tags: [],
//   testCases: [{ input: "", output: "", visible: false }], // Add this
//   solutionCodes: { ...EMPTY_SOLUTION },
//   boilerplateCodes: { ...EMPTY_BOILERPLATE },
// });

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (editing) {
//       await api.put(`/coding/problems/${editing}`, form);
//     } else {
//       await api.post("/coding/problems", form);
//     }
//     const res = await api.get("/coding/problems");
//     setProblems(res.data);
//     setEditing(null);
//     setForm({
//       title: "",
//       description: "",
//       difficulty: "easy",
//       dsaTopic: "",
//       tags: [],
//       testCases: [{ input: "", output: "", visible: false }],
//       solutionCode: "",
//       solutionLanguage: "python3",
//       boilerplateCodes: { ...EMPTY_BOILERPLATE },
//     });
//   };

//   return (
//     <div className="container py-4">
//       <h2 className="fw-bold mb-3">Admin: Coding Problems</h2>
//       <button className="btn btn-success mb-3" onClick={() => startEdit(null)}>
//         + Add New Problem
//       </button>
//       <div className="mb-4">
//         <table className="table table-bordered">
//           <thead>
//             <tr>
//               <th>Title</th>
//               <th>Difficulty</th>
//               <th>DSA Topic</th>
//               <th>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {problems.map((p) => (
//               <tr key={p._id}>
//                 <td>{p.title}</td>
//                 <td>{p.difficulty}</td>
//                 <td>{p.dsaTopic}</td>
//                 <td>
//                   <button
//                     className="btn btn-primary btn-sm"
//                     onClick={() => startEdit(p)}
//                   >
//                     Edit
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//       {(editing !== null || editing === null) && (
//         <form className="card p-3 mb-4" onSubmit={handleSubmit}>
//           <h4>{editing ? "Edit Problem" : "Add New Problem"}</h4>
//           <div className="mb-2">
//             <input
//               className="form-control"
//               placeholder="Title"
//               value={form.title}
//               onChange={(e) => setForm({ ...form, title: e.target.value })}
//               required
//             />
//           </div>
//           <div className="mb-2">
//             <textarea
//               className="form-control"
//               placeholder="Description"
//               rows={4}
//               value={form.description}
//               onChange={(e) =>
//                 setForm({ ...form, description: e.target.value })
//               }
//               required
//             />
//           </div>
//           <div className="mb-2">
//             <select
//               className="form-select w-auto d-inline-block me-2"
//               value={form.difficulty}
//               onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
//             >
//               <option value="easy">Easy</option>
//               <option value="medium">Medium</option>
//               <option value="hard">Hard</option>
//             </select>
//             <select
//               className="form-select w-auto d-inline-block"
//               value={form.dsaTopic}
//               onChange={(e) => setForm({ ...form, dsaTopic: e.target.value })}
//             >
//               <option value="">Select DSA Topic</option>
//               {DSA_TOPICS.map((topic) => (
//                 <option key={topic} value={topic}>
//                   {topic}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div className="mb-2">
//             <label>Tags (comma separated):</label>
//             <input
//               className="form-control"
//               value={form.tags.join(",")}
//               onChange={(e) =>
//                 setForm({
//                   ...form,
//                   tags: e.target.value.split(",").map((t) => t.trim()),
//                 })
//               }
//             />
//           </div>
//           {/* <div className="mb-2">
//             <label>Test Cases:</label>
//             {form.testCases.map((tc, idx) => (
//               <div key={idx} className="d-flex gap-2 mb-2">
//                 <input
//                   className="form-control"
//                   placeholder="Input"
//                   value={tc.input}
//                   onChange={(e) =>
//                     handleTestCaseChange(idx, "input", e.target.value)
//                   }
//                 />
//                 <input
//                   className="form-control"
//                   placeholder="Expected Output"
//                   value={tc.output}
//                   onChange={(e) =>
//                     handleTestCaseChange(idx, "output", e.target.value)
//                   }
//                 />
//                 <select
//                   className="form-select w-auto"
//                   value={tc.visible}
//                   onChange={(e) =>
//                     handleTestCaseChange(
//                       idx,
//                       "visible",
//                       e.target.value === "true"
//                     )
//                   }
//                 >
//                   <option value="false">Hidden</option>
//                   <option value="true">Visible</option>
//                 </select>
//                 <button
//                   type="button"
//                   className="btn btn-danger"
//                   onClick={() => removeTestCase(idx)}
//                 >
//                   &times;
//                 </button>
//               </div>
//             ))}
//             <button
//               type="button"
//               className="btn btn-secondary btn-sm mt-2"
//               onClick={addTestCase}
//             >
//               + Add Test Case
//             </button>
//           </div> */}
//           {/* <div className="mb-2">
//             <label>Solution Code (for checking):</label>
//             <select
//               className="form-select w-auto d-inline-block ms-2"
//               value={form.solutionLanguage}
//               onChange={(e) =>
//                 setForm({ ...form, solutionLanguage: e.target.value })
//               }
//             >
//               {LANGUAGES.map((l) => (
//                 <option key={l.value} value={l.value}>
//                   {l.label}
//                 </option>
//               ))}
//             </select>
//             <textarea
//               className="form-control mt-2"
//               rows={6}
//               placeholder="Paste correct solution code here..."
//               value={form.solutionCode}
//               onChange={(e) =>
//                 setForm({ ...form, solutionCode: e.target.value })
//               }
//             />
//           </div> */}
//           {/* <div className="mb-2">
//   <label>Test Cases:</label>
//   {(form.testCases || []).map((tc, idx) => (
//     <div key={idx} className="d-flex gap-2 mb-2">
//       <input
//         className="form-control"
//         placeholder="Input"
//         value={tc.input}
//         onChange={(e) => handleTestCaseChange(idx, "input", e.target.value)}
//       />
//       <input
//         className="form-control"
//         placeholder="Expected Output"
//         value={tc.output}
//         onChange={(e) => handleTestCaseChange(idx, "output", e.target.value)}
//       />
//       <select
//         className="form-select w-auto"
//         value={tc.visible}
//         onChange={(e) => handleTestCaseChange(idx, "visible", e.target.value === "true")}
//       >
//         <option value="false">Hidden</option>
//         <option value="true">Visible</option>
//       </select>
//       <button type="button" className="btn btn-danger" onClick={() => removeTestCase(idx)}>
//         ×
//       </button>
//     </div>
//   ))}
//   <button type="button" className="btn btn-secondary btn-sm mt-2" onClick={addTestCase}>
//     + Add Test Case
//   </button>
// </div> */}

//           <div className="mb-2">
//             <label>Solution Code (per language):</label>
//             {LANGUAGES.map((lang) => (
//               <div key={lang.value} className="mb-2">
//                 <label className="form-label">{lang.label}</label>
//                 <textarea
//                   className="form-control"
//                   rows={4}
//                   placeholder={`Paste correct solution code for ${lang.label}...`}
//                   // value={form.solutionCodes[lang.value] || ""}
//                   value={form.solutionCodes?.[lang.value] || ""}
//                   onChange={(e) =>
//                     setForm({
//                       ...form,
//                       solutionCodes: {
//                         ...form.solutionCodes,
//                         [lang.value]: e.target.value,
//                       },
//                     })
//                   }
//                 />
//               </div>
//             ))}
//           </div>
//           <div className="mb-2">
//             <label>Boilerplate Code (per language):</label>
//             {/* {LANGUAGES.map((lang) => (
//               <div key={lang.value} className="mb-2">
//                 <label className="form-label">{lang.label}</label>
//                 <textarea
//                   className="form-control"
//                   rows={4}
//                   placeholder={`Paste starter code for ${lang.label}...`}
//                   value={form.boilerplateCodes[lang.value] || ""}
//                   onChange={(e) =>
//                     handleBoilerplateChange(lang.value, e.target.value)
//                   }
//                 />
//               </div>
//             ))} */}

//             {LANGUAGES.map((lang) => (
//               <div key={lang.value} className="mb-2">
//                 <label className="form-label">{lang.label}</label>
//                 <textarea
//                   className="form-control"
//                   rows={4}
//                   placeholder={`Paste starter code for ${lang.label}...`}
//                   // value={form.boilerplateCodes[lang.value] || ""}
//                   value={form.boilerplateCodes?.[lang.value] || ""}
//                   onChange={(e) =>
//                     handleBoilerplateChange(lang.value, e.target.value)
//                   }
//                 />
//               </div>
//             ))}
//           </div>
//           <button className="btn btn-success me-2">
//             {editing ? "Update" : "Create"}
//           </button>
//           <button
//             type="button"
//             className="btn btn-outline-secondary"
//             onClick={() => setEditing(null)}
//           >
//             Cancel
//           </button>
//         </form>
//       )}
//     </div>
//   );
// }





// import React, { useEffect, useState } from "react";
// import api from "../../api/api";

// const DSA_TOPICS = [
//   // Basics
//   "Recursion",

//   // Arrays & Strings
//   "Array",
//   "Matrix", 
//   "String",
//   "TwoPointers",
//   "SlidingWindow",
//   "PrefixSum",

//   // Linked Lists
//   "LinkedList",
//   "DoublyLinkedList",
//   "CircularLinkedList",

//   // Stack & Queue
//   "Stack",
//   "Queue", 
//   "Deque",
//   "PriorityQueue",
//   "MonotonicStack",
//   "MonotonicQueue",

//   // Hashing
//   "HashMap",
//   "HashSet",

//   // Trees
//   "Tree",
//   "BinaryTree",
//   "BST",
//   "Trie",
//   "SegmentTree",
//   "FenwickTree",
//   "Heap",
//   "DisjointSetUnion",

//   // Graphs
//   "Graph",
//   "BFS",
//   "DFS", 
//   "TopologicalSort",
//   "ShortestPath",
//   "Dijkstra",
//   "BellmanFord",
//   "FloydWarshall",
//   "MinimumSpanningTree",
//   "Kruskal",
//   "Prim",
//   "NetworkFlow",

//   // Dynamic Programming
//   "DP",
//   "Knapsack",
//   "LCS",
//   "LIS",
//   "MatrixChainMultiplication", 
//   "CoinChange",
//   "DPonTrees",
//   "DPonGraphs",
//   "BitmaskDP",

//   // Searching
//   "BinarySearch",
//   "TernarySearch",
//   "SearchAlgorithms",

//   // Sorting
//   "Sorting",
//   "MergeSort",
//   "QuickSort",
//   "HeapSort",
//   "CountingSort",
//   "RadixSort",
//   "BucketSort",

//   // Advanced Topics
//   "Greedy",
//   "Backtracking",
//   "DivideAndConquer",
//   "BitManipulation",
//   "Maths",
//   "NumberTheory",
//   "Combinatorics", 
//   "GameTheory",
//   "Geometry",
// ];

// const LANGUAGES = [
//   { label: "Python", value: "python3" },
//   { label: "JavaScript", value: "javascript" },
//   { label: "Java", value: "java" },
//   { label: "C++", value: "cpp" },
// ];

// const EMPTY_BOILERPLATE = { python3: "", java: "", javascript: "", cpp: "" };
// const EMPTY_SOLUTION = { python3: "", java: "", javascript: "", cpp: "" };

// export function AdminCodingProblems() {
//   const [problems, setProblems] = useState([]);
//   const [editing, setEditing] = useState(null);
//   const [form, setForm] = useState({
//     title: "",
//     description: "", 
//     difficulty: "easy",
//     dsaTopic: "",
//     tags: [],
//     testCases: [{ input: "", output: "", visible: false }],
//     solutionCodes: { ...EMPTY_SOLUTION },
//     boilerplateCodes: { ...EMPTY_BOILERPLATE },
//   });

//   const startEdit = (problem) => {
//     setEditing(problem?._id || null);
//     setForm(
//       problem
//         ? {
//             ...problem,
//             tags: problem.tags || [],
//             solutionCodes: {
//               ...EMPTY_SOLUTION,
//               ...(problem.solutionCodes || {}),
//             },
//             boilerplateCodes: {
//               ...EMPTY_BOILERPLATE,
//               ...(problem.boilerplateCodes || {}),
//             },
//           }
//         : {
//             title: "",
//             description: "",
//             difficulty: "easy",
//             dsaTopic: "",
//             tags: [],
//             solutionCodes: { ...EMPTY_SOLUTION },
//             boilerplateCodes: { ...EMPTY_BOILERPLATE },
//           }
//     );
//   };

//   const handleTestCaseChange = (idx, field, value) => {
//     const newCases = [...form.testCases];
//     newCases[idx][field] = value;
//     setForm({ ...form, testCases: newCases });
//   };

//   const addTestCase = () => {
//     setForm({
//       ...form, 
//       testCases: [...form.testCases, { input: "", output: "", visible: false }],
//     });
//   };

//   const removeTestCase = (idx) => {
//     setForm({
//       ...form,
//       testCases: form.testCases.filter((_, i) => i !== idx),
//     });
//   };

//   const handleBoilerplateChange = (lang, value) => {
//     setForm({
//       ...form,
//       boilerplateCodes: {
//         ...form.boilerplateCodes,
//         [lang]: value,
//       },
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (editing) {
//       await api.put(`/coding/problems/${editing}`, form);
//     } else {
//       await api.post("/coding/problems", form);
//     }
//     const res = await api.get("/coding/problems");
//     setProblems(res.data);
//     setEditing(null);
//     setForm({
//       title: "",
//       description: "",
//       difficulty: "easy",
//       dsaTopic: "",
//       tags: [],
//       testCases: [{ input: "", output: "", visible: false }],
//       solutionCode: "",
//       solutionLanguage: "python3",
//       boilerplateCodes: { ...EMPTY_BOILERPLATE },
//     });
//   };

//   return (
//     <div className="container py-4">
//       <h2 className="fw-bold mb-3">Admin: Coding Problems</h2>
//       <button className="btn btn-success mb-3" onClick={() => startEdit(null)}>
//         + Add New Problem
//       </button>
//       <div className="mb-4">
//         <table className="table table-bordered">
//           <thead>
//             <tr>
//               <th>Title</th>
//               <th>Difficulty</th>
//               <th>DSA Topic</th>
//               <th>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {problems.map((p) => (
//               <tr key={p._id}>
//                 <td>{p.title}</td>
//                 <td>{p.difficulty}</td>
//                 <td>{p.dsaTopic}</td>
//                 <td>
//                   <button
//                     className="btn btn-primary btn-sm"
//                     onClick={() => startEdit(p)}
//                   >
//                     Edit
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//       {(editing !== null || editing === null) && (
//         <form className="card p-3 mb-4" onSubmit={handleSubmit}>
//           <h4>{editing ? "Edit Problem" : "Add New Problem"}</h4>
//           <div className="mb-2">
//             <input
//               className="form-control"
//               placeholder="Title"
//               value={form.title}
//               onChange={(e) => setForm({ ...form, title: e.target.value })}
//               required
//             />
//           </div>
//           <div className="mb-2">
//             <textarea
//               className="form-control"
//               placeholder="Description"
//               rows={4}
//               value={form.description}
//               onChange={(e) =>
//                 setForm({ ...form, description: e.target.value })
//               }
//               required
//             />
//           </div>
//           <div className="mb-2">
//             <select
//               className="form-select w-auto d-inline-block me-2"
//               value={form.difficulty}
//               onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
//             >
//               <option value="easy">Easy</option>
//               <option value="medium">Medium</option>
//               <option value="hard">Hard</option>
//             </select>
//             <select
//               className="form-select w-auto d-inline-block"
//               value={form.dsaTopic}
//               onChange={(e) => setForm({ ...form, dsaTopic: e.target.value })}
//             >
//               <option value="">Select DSA Topic</option>
//               {DSA_TOPICS.map((topic) => (
//                 <option key={topic} value={topic}>
//                   {topic}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div className="mb-2">
//             <label>Tags (comma separated):</label>
//             <input
//               className="form-control"
//               value={form.tags.join(",")}
//               onChange={(e) =>
//                 setForm({
//                   ...form,
//                   tags: e.target.value.split(",").map((t) => t.trim()),
//                 })
//               }
//             />
//           </div>
//           <div className="mb-2">
//             <label>Solution Code (per language):</label>
//             {LANGUAGES.map((lang) => (
//               <div key={lang.value} className="mb-2">
//                 <label className="form-label">{lang.label}</label>
//                 <textarea
//                   className="form-control"
//                   rows={4}
//                   placeholder={`Paste correct solution code for ${lang.label}...`}
//                   value={form.solutionCodes?.[lang.value] || ""}
//                   onChange={(e) =>
//                     setForm({
//                       ...form,
//                       solutionCodes: {
//                         ...form.solutionCodes,
//                         [lang.value]: e.target.value,
//                       },
//                     })
//                   }
//                 />
//               </div>
//             ))}
//           </div>
//           <div className="mb-2">
//             <label>Boilerplate Code (per language):</label>
//             {LANGUAGES.map((lang) => (
//               <div key={lang.value} className="mb-2">
//                 <label className="form-label">{lang.label}</label>
//                 <textarea
//                   className="form-control"
//                   rows={4}
//                   placeholder={`Paste starter code for ${lang.label}...`}
//                   value={form.boilerplateCodes?.[lang.value] || ""}
//                   onChange={(e) =>
//                     handleBoilerplateChange(lang.value, e.target.value)
//                   }
//                 />
//               </div>
//             ))}
//           </div>
//           <button className="btn btn-success me-2">
//             {editing ? "Update" : "Create"}
//           </button>
//           <button
//             type="button"
//             className="btn btn-outline-secondary"
//             onClick={() => setEditing(null)}
//           >
//             Cancel
//           </button>
//         </form>
//       )}
//     </div>
//   );
// }












// ...existing code...
import React, { useEffect, useState } from "react";
import api from "../../api/api";

const LANGUAGES = [
  { label: "Python", value: "python3" },
  { label: "JavaScript", value: "javascript" },
  { label: "Java", value: "java" },
  { label: "C++", value: "cpp" },
];

const EMPTY_BOILERPLATE = { python3: "", java: "", javascript: "", cpp: "" };
const EMPTY_SOLUTION = { python3: "", java: "", javascript: "", cpp: "" };

export function AdminCodingProblems() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [problems, setProblems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    difficulty: "easy",
    dsaTopic: "",
    tags: [],
    testCases: [{ input: "", output: "", visible: false }],
    solutionCodes: { ...EMPTY_SOLUTION },
    boilerplateCodes: { ...EMPTY_BOILERPLATE },
  });

  useEffect(() => {
    // keep api interceptor in sync with admin token
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
    fetchProblems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function fetchProblems() {
    setLoading(true);
    try {
      const res = await api.get("/coding/problems");
      setProblems(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load problems");
    } finally {
      setLoading(false);
    }
  }

  function startNew() {
    setEditingId(null);
    setForm({
      title: "",
      description: "",
      difficulty: "easy",
      dsaTopic: "",
      tags: [],
      testCases: [{ input: "", output: "", visible: false }],
      solutionCodes: { ...EMPTY_SOLUTION },
      boilerplateCodes: { ...EMPTY_BOILERPLATE },
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function loadForEdit(p) {
    setEditingId(p._id);
    setForm({
      title: p.title || "",
      description: p.description || "",
      difficulty: p.difficulty || "easy",
      dsaTopic: p.dsaTopic || "",
      tags: p.tags || [],
      testCases: p.testCases && p.testCases.length ? p.testCases : [{ input: "", output: "", visible: false }],
      solutionCodes: p.solutionCodes ? Object.fromEntries(Object.entries(p.solutionCodes)) : { ...EMPTY_SOLUTION },
      boilerplateCodes: p.boilerplateCodes ? Object.fromEntries(Object.entries(p.boilerplateCodes)) : { ...EMPTY_BOILERPLATE },
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const updateField = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const updateTestCase = (i, k, v) => {
    const arr = [...(form.testCases || [])];
    arr[i] = { ...arr[i], [k]: k === "visible" ? !!v : v };
    setForm((s) => ({ ...s, testCases: arr }));
  };

  const addTestCase = () => updateField("testCases", [...form.testCases, { input: "", output: "", visible: false }]);

  const removeTestCase = (i) => updateField("testCases", form.testCases.filter((_, idx) => idx !== i));

  const updateSolution = (lang, code) => updateField("solutionCodes", { ...form.solutionCodes, [lang]: code });

  const updateBoiler = (lang, code) => updateField("boilerplateCodes", { ...form.boilerplateCodes, [lang]: code });

  async function createProblem() {
    try {
      if (!form.title) return alert("Title is required");
      await api.post("/coding/problems", form);
      alert("Created");
      startNew();
      fetchProblems();
    } catch (err) {
      console.error(err);
      alert("Create failed: " + (err?.response?.data?.error || err.message));
    }
  }

  async function saveProblem() {
    if (!editingId) return alert("Select a problem to update");
    try {
      await api.put(`/coding/problems/${editingId}`, form);
      alert("Updated");
      fetchProblems();
    } catch (err) {
      console.error(err);
      alert("Update failed: " + (err?.response?.data?.error || err.message));
    }
  }

  async function deleteProblem() {
    if (!editingId) return alert("Select problem to delete");
    if (!confirm("Delete selected problem?")) return;
    try {
      await api.delete(`/coding/problems/${editingId}`);
      alert("Deleted");
      startNew();
      fetchProblems();
    } catch (err) {
      console.error(err);
      alert("Delete failed: " + (err?.response?.data?.error || err.message));
    }
  }

  return (
    <div className="container py-4">
      <div className="mb-3 d-flex gap-2 align-items-start">
        <div style={{ flex: 1 }}>
          <h4 className="mb-1">Admin — Coding Problems</h4>
          <div className="form-text">Use a valid admin JWT to create/update/delete problems.</div>
        </div>
        <div style={{ width: 420 }}>
          <input className="form-control mb-2" placeholder="Admin JWT (token only or Bearer ...)" value={token} onChange={(e) => setToken(e.target.value)} />
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-outline-secondary" onClick={() => { setToken(""); localStorage.removeItem("token"); }}>Clear</button>
            <button className="btn btn-sm btn-primary" onClick={fetchProblems}>{loading ? "Refreshing..." : "Refresh"}</button>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <div className="card p-3">
            <h5>{editingId ? "Edit Problem" : "Create Problem"}</h5>

            <input className="form-control mb-2" placeholder="Title" value={form.title} onChange={(e) => updateField("title", e.target.value)} required />

            <textarea className="form-control mb-2" rows={4} placeholder="Description" value={form.description} onChange={(e) => updateField("description", e.target.value)} />

            <div className="d-flex mb-2 gap-2">
              <select className="form-select w-auto" value={form.difficulty} onChange={(e) => updateField("difficulty", e.target.value)}>
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
              <input className="form-control" placeholder="DSA Topic" value={form.dsaTopic} onChange={(e) => updateField("dsaTopic", e.target.value)} />
            </div>

            <div className="mb-2">
              <label className="form-label small">Tags (comma separated)</label>
              <input className="form-control" value={(form.tags || []).join(",")} onChange={(e) => updateField("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))} />
            </div>

            <div className="mb-2">
              <label className="form-label small">Test Cases</label>
              {(form.testCases || []).map((tc, idx) => (
                <div key={idx} className="d-flex gap-2 mb-2">
                  <input className="form-control" placeholder="Input" value={tc.input} onChange={(e) => updateTestCase(idx, "input", e.target.value)} />
                  <input className="form-control" placeholder="Output" value={tc.output} onChange={(e) => updateTestCase(idx, "output", e.target.value)} />
                  <select className="form-select w-auto" value={tc.visible ? "true" : "false"} onChange={(e) => updateTestCase(idx, "visible", e.target.value === "true")}>
                    <option value="false">Hidden</option>
                    <option value="true">Visible</option>
                  </select>
                  <button type="button" className="btn btn-danger" onClick={() => removeTestCase(idx)}>&times;</button>
                </div>
              ))}
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={addTestCase}>+ Add test case</button>
            </div>

            <div className="mb-2">
              <label className="form-label small">Solution Codes (per language)</label>
              {LANGUAGES.map((L) => (
                <div key={L.value} className="mb-2">
                  <label className="form-label">{L.label}</label>
                  <textarea className="form-control" rows={3} placeholder={`Solution for ${L.label}`} value={form.solutionCodes?.[L.value] || ""} onChange={(e) => updateSolution(L.value, e.target.value)} />
                </div>
              ))}
            </div>

            <div className="mb-2">
              <label className="form-label small">Boilerplate Codes (per language)</label>
              {LANGUAGES.map((L) => (
                <div key={L.value} className="mb-2">
                  <label className="form-label">{L.label}</label>
                  <textarea className="form-control" rows={3} placeholder={`Boilerplate for ${L.label}`} value={form.boilerplateCodes?.[L.value] || ""} onChange={(e) => updateBoiler(L.value, e.target.value)} />
                </div>
              ))}
            </div>

            <div className="d-flex gap-2">
              <button type="button" className="btn btn-success" onClick={editingId ? saveProblem : createProblem}>{editingId ? "Save changes" : "Create problem"}</button>
              <button type="button" className="btn btn-outline-secondary" onClick={startNew}>Clear</button>
              <button type="button" className="btn btn-danger ms-auto" onClick={deleteProblem} disabled={!editingId}>Delete</button>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card p-3">
            <h5>Problems</h5>
            <div style={{ maxHeight: "70vh", overflow: "auto" }}>
              {problems.map((p) => (
                <div key={p._id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-start" style={{ cursor: "pointer" }}>
                  <div onClick={() => loadForEdit(p)} style={{ flex: 1 }}>
                    <div><strong>{p.title}</strong> <small className="text-muted">({p.difficulty})</small></div>
                    <div className="small text-muted">{p.dsaTopic} — {p.tags?.join(", ")}</div>
                  </div>
                  <div className="ms-2">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => loadForEdit(p)}>Edit</button>
                  </div>
                </div>
              ))}
              {problems.length === 0 && <div className="text-muted p-3">No problems</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// ...existing code...