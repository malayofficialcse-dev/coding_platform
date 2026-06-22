import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { useParams, useNavigate, Link } from "react-router-dom";

const LANGUAGES = [
  "python",
  "javascript",
  "java",
  "c",
  "cpp",
  "csharp",
  "ruby",
  "go",
  "php",
  "html",
  "css",
  "bash",
  "json",
  "sql",
  "dockerfile",
  "yaml"
];

export default function AdminCourseEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  
  // State for course basic details
  const [course, setCourse] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", image: "" });
  const [imageFile, setImageFile] = useState(null);

  // State for Topics management
  const [newTopic, setNewTopic] = useState({ title: "", order: 0 });
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [topicForm, setTopicForm] = useState({ title: "", order: 0 });

  // State for Subtopics editing
  const [editingSubtopicId, setEditingSubtopicId] = useState(null);
  const [editingSubtopicTopicId, setEditingSubtopicTopicId] = useState(null);
  const [subtopicForm, setSubtopicForm] = useState({
    title: "",
    body: "",
    order: 0,
    images: [""], // URLs
    imageFiles: [], // Local files
    codeBlocks: [],
  });
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = () => {
    api.get(`/courses/${id}`).then((res) => {
      setCourse(res.data);
      setForm({
        title: res.data.title,
        description: res.data.description,
        image: res.data.image || "",
      });
    });
  };

  // Handle course basic details file change
  const handleImageFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  // Submit Course Basic Details
  const submitCourse = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("title", form.title);
    data.append("description", form.description);
    if (imageFile) {
      data.append("image", imageFile);
    } else {
      data.append("image", form.image);
    }
    try {
      await api.put(`/courses/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Course details saved successfully!");
      fetchCourse();
    } catch (err) {
      alert("Failed to update course details");
    }
  };

  // --- Topic handlers ---
  const handleAddTopic = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/courses/${id}/topics`, newTopic);
      setCourse(res.data);
      setNewTopic({ title: "", order: 0 });
    } catch (err) {
      alert("Failed to add topic");
    }
  };

  const handleUpdateTopic = async (e, topicId) => {
    e.preventDefault();
    try {
      const res = await api.put(`/courses/${id}/topics/${topicId}`, topicForm);
      setCourse(res.data);
      setEditingTopicId(null);
    } catch (err) {
      alert("Failed to update topic");
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm("Are you sure you want to delete this topic and all its subtopics?")) return;
    try {
      const res = await api.delete(`/courses/${id}/topics/${topicId}`);
      // Handle either structure of backend response
      setCourse(res.data.course || res.data);
    } catch (err) {
      alert("Failed to delete topic");
    }
  };

  // --- Subtopic handlers ---
  const startEditSubtopic = (topicId, subtopic) => {
    setEditingSubtopicId(subtopic._id);
    setEditingSubtopicTopicId(topicId);
    setSubtopicForm({
      title: subtopic.title,
      body: subtopic.body || "",
      order: subtopic.order || 0,
      images: subtopic.images && subtopic.images.length ? subtopic.images : [""],
      imageFiles: [],
      codeBlocks: subtopic.codeBlocks && subtopic.codeBlocks.length ? subtopic.codeBlocks : [],
    });
  };

  const handleSubtopicImageChange = (idx, value) => {
    const newImages = [...subtopicForm.images];
    newImages[idx] = value;
    setSubtopicForm({ ...subtopicForm, images: newImages });
  };

  const addSubtopicImageField = () => {
    if (subtopicForm.images.length + subtopicForm.imageFiles.length < 10) {
      setSubtopicForm({ ...subtopicForm, images: [...subtopicForm.images, ""] });
    }
  };

  const removeSubtopicImageField = (idx) => {
    const newImages = subtopicForm.images.filter((_, i) => i !== idx);
    setSubtopicForm({ ...subtopicForm, images: newImages });
  };

  const handleSubtopicImageFiles = (e) => {
    const files = Array.from(e.target.files);
    const allowed = Math.max(0, 10 - subtopicForm.images.length);
    setSubtopicForm({
      ...subtopicForm,
      imageFiles: files.slice(0, allowed),
    });
  };

  const handleCodeChange = (idx, field, value) => {
    const newBlocks = [...subtopicForm.codeBlocks];
    newBlocks[idx][field] = value;
    setSubtopicForm({ ...subtopicForm, codeBlocks: newBlocks });
  };

  const addCodeBlock = () => {
    if (subtopicForm.codeBlocks.length < 10) {
      setSubtopicForm({
        ...subtopicForm,
        codeBlocks: [
          ...subtopicForm.codeBlocks,
          { language: "python", code: "" },
        ],
      });
    }
  };

  const removeCodeBlock = (idx) => {
    const newBlocks = subtopicForm.codeBlocks.filter((_, i) => i !== idx);
    setSubtopicForm({ ...subtopicForm, codeBlocks: newBlocks });
  };

  const submitSubtopic = async (e) => {
    e.preventDefault();
    setUploadingImages(true);

    const codeBlocks = subtopicForm.codeBlocks.filter(
      (cb) => cb.code.trim() !== ""
    );
    const data = new FormData();
    data.append("title", subtopicForm.title);
    data.append("body", subtopicForm.body);
    data.append("order", subtopicForm.order);

    // Add code blocks
    codeBlocks.forEach((cb, i) => {
      data.append(`codeBlocks[${i}][language]`, cb.language);
      data.append(`codeBlocks[${i}][code]`, cb.code);
    });

    // Add image URLs
    subtopicForm.images
      .filter((img) => img.trim() !== "")
      .forEach((img) => data.append("images", img));

    // Add local image files
    subtopicForm.imageFiles.forEach((img) => data.append("images", img));

    try {
      const res = await api.put(
        `/courses/${id}/topics/${editingSubtopicTopicId}/subtopics/${editingSubtopicId}`,
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setCourse(res.data);
      setEditingSubtopicId(null);
      setEditingSubtopicTopicId(null);
      alert("Subtopic updated successfully!");
    } catch (err) {
      alert("Failed to update subtopic");
    }
    setUploadingImages(false);
  };

  const handleDeleteSubtopic = async (topicId, subtopicId) => {
    if (!window.confirm("Are you sure you want to delete this subtopic?")) return;
    try {
      const res = await api.delete(`/courses/${id}/topics/${topicId}/subtopics/${subtopicId}`);
      setCourse(res.data.course || res.data);
    } catch (err) {
      alert("Failed to delete subtopic");
    }
  };

  if (!course)
    return <div className="container py-5 text-center">Loading...</div>;

  return (
    <div className="container py-4" style={{ maxWidth: "900px" }}>
      <h2 className="fw-bold mb-4 text-primary">Course Editor & Builder</h2>

      {/* Course General Settings */}
      <div className="card shadow-sm border-0 rounded-4 p-4 mb-5 bg-white">
        <h4 className="fw-bold text-dark mb-3 border-bottom pb-2">Course Details</h4>
        <form onSubmit={submitCourse}>
          <div className="mb-3">
            <label className="form-label fw-bold">Course Title:</label>
            <input
              className="form-control"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold">Course Description:</label>
            <textarea
              className="form-control"
              placeholder="Description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>
          <div className="mb-4">
            <label className="form-label fw-bold">Course Cover Image:</label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={handleImageFileChange}
            />
            {imageFile ? (
              <div className="mt-2">
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="preview"
                  style={{
                    width: 120,
                    height: 120,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
              </div>
            ) : (
              form.image && (
                <div className="mt-2">
                  <img
                    src={form.image}
                    alt="current"
                    style={{
                      width: 120,
                      height: 120,
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                </div>
              )
            )}
            <div className="form-text mt-2">
              Or paste a cover image URL (will be ignored if a local file is selected):
            </div>
            <input
              className="form-control mt-1"
              placeholder="Cover Image URL"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
            />
          </div>
          <button className="btn btn-success px-4">Save Course Details</button>
        </form>
      </div>

      {/* Curriculum Section */}
      <h3 className="fw-bold mb-4 mt-5 border-top pt-4 text-dark">Syllabus Curriculum Builder</h3>
      
      {/* Add Topic Form */}
      <div className="card shadow-sm border-0 rounded-4 p-4 mb-4 bg-light">
        <h5 className="fw-bold text-dark mb-3">Add New Topic</h5>
        <form onSubmit={handleAddTopic} className="row g-2">
          <div className="col-md-7">
            <input
              className="form-control"
              placeholder="Topic Title (e.g., Intro to DevOps)"
              value={newTopic.title}
              onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
              required
            />
          </div>
          <div className="col-md-3">
            <input
              type="number"
              className="form-control"
              placeholder="Order index (0)"
              value={newTopic.order || ""}
              onChange={(e) => setNewTopic({ ...newTopic, order: Number(e.target.value) })}
            />
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-primary w-100">+ Add Topic</button>
          </div>
        </form>
      </div>

      {/* Topics & Subtopics List */}
      {course.topics && course.topics.length > 0 ? (
        course.topics
          .sort((a, b) => a.order - b.order)
          .map((topic) => (
            <div key={topic._id} className="card border shadow-sm rounded-4 mb-4 overflow-hidden">
              <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-bottom-0">
                {editingTopicId === topic._id ? (
                  <form onSubmit={(e) => handleUpdateTopic(e, topic._id)} className="d-flex gap-2 align-items-center w-75">
                    <input
                      className="form-control form-control-sm"
                      value={topicForm.title}
                      onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                      required
                    />
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={topicForm.order}
                      style={{ width: "80px" }}
                      onChange={(e) => setTopicForm({ ...topicForm, order: Number(e.target.value) })}
                    />
                    <button type="submit" className="btn btn-success btn-sm">Save</button>
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setEditingTopicId(null)}>Cancel</button>
                  </form>
                ) : (
                  <div>
                    <h5 className="fw-bold m-0 text-dark">
                      {topic.title} <span className="badge bg-secondary-subtle text-secondary ms-2 small">Order: {topic.order}</span>
                    </h5>
                  </div>
                )}
                
                {editingTopicId !== topic._id && (
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => {
                        setEditingTopicId(topic._id);
                        setTopicForm({ title: topic.title, order: topic.order });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleDeleteTopic(topic._id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <div className="card-body bg-light-subtle px-4 border-top">
                {/* Subtopics Header */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-muted m-0">Subtopics (Contents)</h6>
                  <Link
                    to={`/admin/courses/${course._id}/content?topicId=${topic._id}`}
                    className="btn btn-sm btn-link text-decoration-none fw-semibold p-0"
                  >
                    + Add Subtopic
                  </Link>
                </div>

                <div className="list-group mb-2">
                  {topic.subtopics && topic.subtopics.length > 0 ? (
                    topic.subtopics
                      .sort((a, b) => a.order - b.order)
                      .map((sub) => (
                        <div key={sub._id} className="list-group-item d-flex justify-content-between align-items-center p-3 rounded-3 mb-2 border">
                          <div>
                            <span className="fw-bold text-primary">{sub.title}</span>
                            <span className="badge bg-light text-dark border ms-2">Order: {sub.order}</span>
                            {sub.body && <p className="text-muted small m-0 mt-1">{sub.body.substring(0, 100)}...</p>}
                          </div>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => startEditSubtopic(topic._id, sub)}
                            >
                              Edit Subtopic
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteSubtopic(topic._id, sub._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-muted p-3 bg-white rounded border border-dashed text-center mb-2">
                      No subtopics in this topic yet. Click "+ Add Subtopic" to populate content.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
      ) : (
        <div className="alert alert-info rounded-4 text-center py-4 shadow-sm">
          No curriculum created yet. Create a Topic above!
        </div>
      )}

      {/* Subtopic Editor Modal/Overlay */}
      {editingSubtopicId && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50" style={{ zIndex: 1050 }}>
          <div className="card shadow-lg border-0 rounded-4 w-100 m-3 p-4 overflow-auto bg-white" style={{ maxWidth: "800px", maxHeight: "90vh" }}>
            <div className="card-header bg-white border-0 pb-3 d-flex justify-content-between align-items-center border-bottom">
              <h4 className="fw-bold text-primary m-0">Edit Subtopic Content</h4>
              <button
                type="button"
                className="btn-close"
                onClick={() => {
                  setEditingSubtopicId(null);
                  setEditingSubtopicTopicId(null);
                }}
              ></button>
            </div>
            <form onSubmit={submitSubtopic} className="card-body pt-3">
              <div className="mb-3">
                <label className="form-label fw-bold">Title:</label>
                <input
                  className="form-control"
                  value={subtopicForm.title}
                  onChange={(e) => setSubtopicForm({ ...subtopicForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Body Content (Markdown):</label>
                <textarea
                  className="form-control font-monospace"
                  rows={6}
                  value={subtopicForm.body}
                  onChange={(e) => setSubtopicForm({ ...subtopicForm, body: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Display Order:</label>
                <input
                  type="number"
                  className="form-control"
                  value={subtopicForm.order}
                  onChange={(e) => setSubtopicForm({ ...subtopicForm, order: Number(e.target.value) })}
                />
              </div>

              {/* Subtopic Image fields */}
              <div className="mb-3">
                <label className="form-label fw-bold">Image URLs (max 10 total):</label>
                {subtopicForm.images.map((img, idx) => (
                  <div key={idx} className="d-flex mb-2">
                    <input
                      type="url"
                      className="form-control"
                      placeholder={`Image URL #${idx + 1}`}
                      value={img}
                      onChange={(e) => handleSubtopicImageChange(idx, e.target.value)}
                    />
                    {subtopicForm.images.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-danger ms-2"
                        onClick={() => removeSubtopicImageField(idx)}
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
                {subtopicForm.images.length + subtopicForm.imageFiles.length < 10 && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm mt-2"
                    onClick={addSubtopicImageField}
                  >
                    + Add Image URL Field
                  </button>
                )}
                <div className="mt-3">
                  <label className="form-label fw-bold">Or upload local images:</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="form-control"
                    onChange={handleSubtopicImageFiles}
                    disabled={subtopicForm.images.length + subtopicForm.imageFiles.length >= 10}
                  />
                  {subtopicForm.imageFiles.length > 0 && (
                    <div className="mt-2">
                      {subtopicForm.imageFiles.map((file, idx) => (
                        <span key={idx} className="badge bg-info me-2">
                          {file.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Subtopic Code blocks */}
              <div className="mb-4">
                <label className="form-label fw-bold">Code Blocks (max 10):</label>
                {subtopicForm.codeBlocks.map((cb, idx) => (
                  <div key={idx} className="mb-3 p-3 border rounded bg-light">
                    <div className="d-flex mb-2 align-items-center justify-content-between">
                      <span className="badge bg-secondary">Block #{idx + 1}</span>
                      <div className="d-flex gap-2">
                        <select
                          className="form-select form-select-sm"
                          value={cb.language}
                          onChange={(e) => handleCodeChange(idx, "language", e.target.value)}
                          style={{ width: 140 }}
                        >
                          {LANGUAGES.map((lang) => (
                            <option key={lang} value={lang}>
                              {lang}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => removeCodeBlock(idx)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <textarea
                      className="form-control font-monospace text-light bg-dark"
                      rows={5}
                      placeholder="Paste or write code here..."
                      value={cb.code}
                      onChange={(e) => handleCodeChange(idx, "code", e.target.value)}
                    />
                  </div>
                ))}
                {subtopicForm.codeBlocks.length < 10 && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={addCodeBlock}
                  >
                    + Add Code Block
                  </button>
                )}
              </div>

              <div className="d-flex gap-2 border-top pt-3">
                <button
                  type="submit"
                  className="btn btn-success px-4"
                  disabled={uploadingImages}
                >
                  {uploadingImages ? "Uploading..." : "Save Subtopic"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setEditingSubtopicId(null);
                    setEditingSubtopicTopicId(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-4">
        <Link to="/admin/courses" className="btn btn-link text-decoration-none">
          ← Back to Courses List
        </Link>
      </div>
    </div>
  );
}
