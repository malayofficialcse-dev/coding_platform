import React, { useState } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";

export default function AddCourse() {
  const [form, setForm] = useState({
    title: "",
    description: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const nav = useNavigate();

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const submit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("title", form.title);
    data.append("description", form.description);
    if (imageFile) data.append("image", imageFile);
    try {
      await api.post("/courses", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      nav("/admin/courses");
    } catch (err) {
      alert("Failed to add course");
    }
  };

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-3">Add Course</h2>
      <form onSubmit={submit}>
        <div className="mb-3">
          <input
            className="form-control"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>
        <div className="mb-3">
          <textarea
            className="form-control"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Upload Course Image (optional):</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={handleImageChange}
          />
          {imageFile && (
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
          )}
        </div>
        <button className="btn btn-success">Add Course</button>
      </form>
    </div>
  );
}
