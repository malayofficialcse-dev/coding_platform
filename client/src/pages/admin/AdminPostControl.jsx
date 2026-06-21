import React, { useEffect, useState } from "react";
import api from "../../api/api";

export default function AdminPostControl() {
  const [posts, setPosts] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editPost, setEditPost] = useState({ title: "", content: "" });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const res = await api.get("/admin/posts");
    setPosts(res.data);
  };

  const handleDelete = async (id) => {
    await api.delete(`/admin/posts/${id}`);
    fetchPosts();
  };

  const handleEdit = (post) => {
    setEditId(post._id);
    setEditPost({ title: post.title, content: post.content });
  };

  const handleUpdate = async (id) => {
    await api.put(`/admin/posts/${id}`, editPost);
    setEditId(null);
    setEditPost({ title: "", content: "" });
    fetchPosts();
  };

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">Admin: Control All Posts</h2>
      <ul className="list-group">
        {posts.map((post) => (
          <li key={post._id} className="list-group-item">
            {editId === post._id ? (
              <div>
                <input
                  value={editPost.title}
                  onChange={(e) =>
                    setEditPost((p) => ({ ...p, title: e.target.value }))
                  }
                  className="form-control mb-2"
                  placeholder="Title"
                />
                <textarea
                  value={editPost.content}
                  onChange={(e) =>
                    setEditPost((p) => ({ ...p, content: e.target.value }))
                  }
                  className="form-control mb-2"
                  placeholder="Content"
                />
                <button
                  className="btn btn-success btn-sm me-2"
                  onClick={() => handleUpdate(post._id)}
                >
                  Save
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setEditId(null)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  {/* <strong>{post.title}</strong> by{" "}
                  {post.author?.username || post.author}
                  <div className="text-muted small">{post.content}</div> */}
                  <strong>{post.title}</strong> by{" "}
                  {typeof post.author === "object"
                    ? post.author.username ||
                      post.author.email ||
                      post.author._id
                    : post.author}
                  <div className="text-muted small">{post.content}</div>
                </div>
                <div>
                  <button
                    className="btn btn-warning btn-sm me-2"
                    onClick={() => handleEdit(post)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(post._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
