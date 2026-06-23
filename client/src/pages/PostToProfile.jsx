import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import PostCard from "../components/PostCard";
import FollowButton from "../components/FollowButton";
import { AuthContext } from "../contexts/AuthContext";

export default function PostToProfile() {
  const { id } = useParams(); // user id from URL
  const { user: currentUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Fetch user profile, posts, courses, and exams
    api.get(`/users/${id}`).then((profileRes) => {
      setProfile(profileRes.data);
      // Fetch posts
      api.get(`/posts/user/${id}`).then((postsRes) => setPosts(postsRes.data));
      // Fetch enrollments for this user, then fetch course details
      api.get(`/enrollments/user/${id}`).then((enrollRes) => {
        const courseList = enrollRes.data
          .map((en) => en.course)
          .filter(Boolean);
        setCourses(courseList);
      });
      // Fetch exam attempts for this user, then fetch exam details
      api.get(`/attempts/user/${id}`).then((attemptRes) => {
        const examList = attemptRes.data.map((a) => a.exam).filter(Boolean);
        setExams(examList);
        setLoading(false);
      });
    });
  }, [id]);

  const handleUpdatePost = (updatedPost) => {
    setPosts((prev) => prev.map((post) => (post._id === updatedPost._id ? updatedPost : post)));
  };

  const handleDeletePost = (postId) => {
    setPosts((prev) => prev.filter((post) => post._id !== postId));
  };

  if (loading) return <div className="text-center py-5">Loading...</div>;
  if (!profile)
    return <div className="text-center py-5 text-danger">User not found</div>;

  return (
    <div className="container py-4">
      <div className="card mb-4 shadow-sm border-0 rounded-4">
        <div className="card-body d-flex align-items-center">
          <img
            src={
              profile.profileImage ||
              "https://static.vecteezy.com/system/resources/previews/018/742/015/original/minimal-profile-account-symbol-user-interface-theme-3d-icon-rendering-illustration-isolated-in-transparent-background-png.png"
            }
            alt="Profile"
            className="rounded-circle border me-3"
            style={{ width: 80, height: 80, objectFit: "cover" }}
          />
          <div>
            <h3 className="fw-bold mb-1">{profile.name || profile.username}</h3>
            <div className="mb-2">
              <span className="badge bg-info me-2">{profile.role}</span>
              <span className="me-3">
                Followers: <b>{profile.followers?.length || 0}</b>
              </span>
              <span>
                Following: <b>{profile.following?.length || 0}</b>
              </span>
            </div>
            {currentUser && currentUser._id !== profile._id && (
              <FollowButton userId={profile._id} />
            )}
          </div>
        </div>
      </div>

      <h4 className="fw-bold mb-3">Posts</h4>
      <div className="row g-4 mb-4">
        {posts.length === 0 && (
          <div className="text-muted ms-2">No posts yet.</div>
        )}
        {posts.map((post) => (
          <div className="col-md-6 col-lg-4" key={post._id}>
            <PostCard
              post={post}
              user={currentUser}
              onUpdate={handleUpdatePost}
              onDelete={handleDeletePost}
            />
          </div>
        ))}
      </div>

      <h4 className="fw-bold mb-3">Courses</h4>
      <div className="row g-3 mb-4">
        {courses.length === 0 && (
          <div className="text-muted ms-2">No courses yet.</div>
        )}
        {courses.map((course) => (
          <div className="col-md-4" key={course._id}>
            <div className="card h-100 shadow border-0 rounded-4">
              <div className="card-body">
                <h5 className="fw-bold">{course.title}</h5>
                <p className="text-muted">{course.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h4 className="fw-bold mb-3">Exams</h4>
      <div className="row g-3 mb-4">
        {exams.length === 0 && (
          <div className="text-muted ms-2">No exams yet.</div>
        )}
        {exams.map((exam) => (
          <div className="col-md-4" key={exam._id}>
            <div className="card h-100 shadow border-0 rounded-4">
              <div className="card-body">
                <h5 className="fw-bold">{exam.title}</h5>
                <p className="text-muted">{exam.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
