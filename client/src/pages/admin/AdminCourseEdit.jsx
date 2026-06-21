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
];

export default function AdminCourseEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const [course, setCourse] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", image: "" });
  const [imageFile, setImageFile] = useState(null);
  const [editingContent, setEditingContent] = useState(null);
  const [contentForm, setContentForm] = useState({
    title: "",
    body: "",
    order: 0,
    images: [""], // URLs
    imageFiles: [], // Local files
    codeBlocks: [],
  });
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    api.get(`/courses/${id}`).then((res) => {
      setCourse(res.data);
      setForm({
        title: res.data.title,
        description: res.data.description,
        image: res.data.image || "",
      });
    });
  }, [id]);

  // Handle course image file change
  const handleImageFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  // Edit course
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
    await api.put(`/courses/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    nav("/admin/courses");
  };

  // Edit content
  const startEditContent = (content) => {
    setEditingContent(content._id);
    setContentForm({
      title: content.title,
      body: content.body,
      order: content.order,
      images: content.images && content.images.length ? content.images : [""],
      imageFiles: [],
      codeBlocks:
        content.codeBlocks && content.codeBlocks.length
          ? content.codeBlocks
          : [],
    });
  };

  // Image handlers for content
  const handleImageChange = (idx, value) => {
    const newImages = [...contentForm.images];
    newImages[idx] = value;
    setContentForm({ ...contentForm, images: newImages });
  };
  const addImageField = () => {
    if (contentForm.images.length + contentForm.imageFiles.length < 10) {
      setContentForm({ ...contentForm, images: [...contentForm.images, ""] });
    }
  };
  const removeImageField = (idx) => {
    const newImages = contentForm.images.filter((_, i) => i !== idx);
    setContentForm({ ...contentForm, images: newImages });
  };

  // Handle local image files for content
  const handleContentImageFiles = (e) => {
    const files = Array.from(e.target.files);
    // Limit total images to 10
    const allowed = Math.max(0, 10 - contentForm.images.length);
    setContentForm({
      ...contentForm,
      imageFiles: files.slice(0, allowed),
    });
  };

  // Code block handlers
  const handleCodeChange = (idx, field, value) => {
    const newBlocks = [...contentForm.codeBlocks];
    newBlocks[idx][field] = value;
    setContentForm({ ...contentForm, codeBlocks: newBlocks });
  };
  const addCodeBlock = () => {
    if (contentForm.codeBlocks.length < 10)
      setContentForm({
        ...contentForm,
        codeBlocks: [
          ...contentForm.codeBlocks,
          { language: "python", code: "" },
        ],
      });
  };
  const removeCodeBlock = (idx) => {
    const newBlocks = contentForm.codeBlocks.filter((_, i) => i !== idx);
    setContentForm({ ...contentForm, codeBlocks: newBlocks });
  };

  // Upload local images to Cloudinary and get URLs
  const uploadImagesToCloudinary = async (files) => {
    const urls = [];
    for (const file of files) {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "online-exam"); // Your Cloudinary unsigned preset
      data.append("folder", "online-exam/course-images");
      // Direct upload to Cloudinary REST API
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dykpztnpu/image/upload",
        {
          method: "POST",
          body: data,
        }
      );
      const result = await res.json();
      if (result.secure_url) urls.push(result.secure_url);
    }
    return urls;
  };

  // const submitContent = async (e) => {
  //   e.preventDefault();
  //   setUploadingImages(true);
  //   let imageUrls = contentForm.images.filter((img) => img.trim() !== "");
  //   // Upload local files if any
  //   if (contentForm.imageFiles.length > 0) {
  //     const uploadedUrls = await uploadImagesToCloudinary(
  //       contentForm.imageFiles
  //     );
  //     imageUrls = [...imageUrls, ...uploadedUrls].slice(0, 10);
  //   }
  //   setUploadingImages(false);
  //   await api.put(`/courses/${id}/content/${editingContent}`, {
  //     ...contentForm,
  //     images: imageUrls,
  //     codeBlocks: contentForm.codeBlocks.filter((cb) => cb.code.trim() !== ""),
  //   });
  //   // Refresh course data
  //   const res = await api.get(`/courses/${id}`);
  //   setCourse(res.data);
  //   setEditingContent(null);
  // };

  const submitContent = async (e) => {
    e.preventDefault();
    setUploadingImages(true);

    const codeBlocks = contentForm.codeBlocks.filter(
      (cb) => cb.code.trim() !== ""
    );
    const data = new FormData();
    data.append("title", contentForm.title);
    data.append("body", contentForm.body);
    data.append("order", contentForm.order);

    // Add code blocks
    codeBlocks.forEach((cb, i) => {
      data.append(`codeBlocks[${i}][language]`, cb.language);
      data.append(`codeBlocks[${i}][code]`, cb.code);
    });

    // Add image URLs
    contentForm.images
      .filter((img) => img.trim() !== "")
      .forEach((img) => data.append("images", img));

    // Add local image files
    contentForm.imageFiles.forEach((img) => data.append("images", img));

    try {
      await api.put(`/courses/${id}/content/${editingContent}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Refresh course data
      const res = await api.get(`/courses/${id}`);
      setCourse(res.data);
      setEditingContent(null);
    } catch (err) {
      alert("Failed to update content");
    }
    setUploadingImages(false);
  };

  if (!course)
    return <div className="container py-5 text-center">Loading...</div>;

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-3">Edit Course</h2>
      <form className="mb-4" onSubmit={submitCourse}>
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
          <label className="form-label">Update Course Image:</label>
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
          <div className="form-text">
            Or paste an image URL below (will be used if no file is selected):
          </div>
          <input
            className="form-control mt-2"
            placeholder="Image URL"
            value={form.image}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
          />
        </div>
        <button className="btn btn-success">Save Course</button>
      </form>
      <h3 className="fw-bold mb-3">Edit Contents</h3>
      {course.contents && course.contents.length > 0 ? (
        course.contents
          .sort((a, b) => a.order - b.order)
          .map((content, idx) => (
            <div key={content._id} className="card mb-3">
              <div className="card-body">
                <h5 className="fw-bold">{content.title}</h5>
                <p className="text-muted">{content.body.slice(0, 100)}...</p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => startEditContent(content)}
                >
                  Edit Content
                </button>
              </div>
              {editingContent === content._id && (
                <form className="p-3 border-top" onSubmit={submitContent}>
                  <div className="mb-2">
                    <input
                      className="form-control"
                      placeholder="Title"
                      value={contentForm.title}
                      onChange={(e) =>
                        setContentForm({
                          ...contentForm,
                          title: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <textarea
                      className="form-control"
                      placeholder="Body (Markdown/HTML allowed)"
                      rows={4}
                      value={contentForm.body}
                      onChange={(e) =>
                        setContentForm({ ...contentForm, body: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Order"
                      value={contentForm.order}
                      onChange={(e) =>
                        setContentForm({
                          ...contentForm,
                          order: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">
                      Image URLs (paste or upload, up to 10):
                    </label>
                    {contentForm.images.map((img, idx) => (
                      <div key={idx} className="d-flex mb-2">
                        <input
                          type="url"
                          className="form-control"
                          placeholder={`Image URL #${idx + 1}`}
                          value={img}
                          onChange={(e) =>
                            handleImageChange(idx, e.target.value)
                          }
                        />
                        {contentForm.images.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-danger ms-2"
                            onClick={() => removeImageField(idx)}
                            tabIndex={-1}
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                    {contentForm.images.length + contentForm.imageFiles.length <
                      10 && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm mt-2"
                        onClick={addImageField}
                      >
                        + Add Image URL
                      </button>
                    )}
                    <div className="mt-2">
                      <label className="form-label">
                        Or upload images from your computer (max{" "}
                        {10 - contentForm.images.length}):
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="form-control"
                        onChange={handleContentImageFiles}
                        disabled={
                          contentForm.images.length +
                            contentForm.imageFiles.length >=
                          10
                        }
                      />
                      {contentForm.imageFiles.length > 0 && (
                        <div className="mt-2">
                          {contentForm.imageFiles.map((file, idx) => (
                            <span key={idx} className="badge bg-info me-2">
                              {file.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="form-label">
                      Code Blocks (up to 10):
                    </label>
                    {contentForm.codeBlocks.map((cb, idx) => (
                      <div
                        key={idx}
                        className="mb-2 p-2 border rounded bg-light"
                      >
                        <div className="d-flex mb-2">
                          <select
                            className="form-select me-2"
                            value={cb.language}
                            onChange={(e) =>
                              handleCodeChange(idx, "language", e.target.value)
                            }
                            style={{ maxWidth: 180 }}
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
                        <textarea
                          className="form-control font-monospace"
                          rows={6}
                          placeholder="Paste or write code here..."
                          value={cb.code}
                          onChange={(e) =>
                            handleCodeChange(idx, "code", e.target.value)
                          }
                          style={{ background: "#222", color: "#fff" }}
                        />
                      </div>
                    ))}
                    {contentForm.codeBlocks.length < 10 && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm mt-2"
                        onClick={addCodeBlock}
                      >
                        + Add Code Block
                      </button>
                    )}
                  </div>
                  <button
                    className="btn btn-success btn-sm me-2"
                    disabled={uploadingImages}
                  >
                    {uploadingImages ? "Uploading Images..." : "Save Content"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setEditingContent(null)}
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          ))
      ) : (
        <div className="alert alert-info">No contents yet.</div>
      )}
      <Link to="/admin/courses" className="btn btn-link mt-3">
        Back to Courses
      </Link>
    </div>
  );
}
