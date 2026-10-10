import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import PostCard from "../components/PostCard";
import FollowButton from "../components/FollowButton";
import { AuthContext } from "../contexts/AuthContext";
import { optimizedImageUrl } from "../utils/imageUrl";
import "./PostToProfile.css";

const DEFAULT_AVATAR = "https://static.vecteezy.com/system/resources/previews/018/742/015/original/minimal-profile-account-symbol-user-interface-theme-3d-icon-rendering-illustration-isolated-in-transparent-background-png.png";

export default function PostToProfile() {
  const { id } = useParams(); // user id from URL
  const { user: currentUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const [profileRes, postsRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get(`/posts/user/${id}`),
        ]);
        setProfile(profileRes.data);
        setPosts(postsRes.data);

        const isOwnProfile = currentUser?._id === id;
        const canViewLearningData = isOwnProfile || currentUser?.role === "admin";
        if (!canViewLearningData) {
          setCourses([]);
          setExams([]);
          return;
        }

        const [enrollmentsRes, attemptsRes] = await Promise.all([
          api.get(isOwnProfile ? "/enrollments/my" : `/enrollments/user/${id}`),
          api.get(isOwnProfile ? "/attempts/my" : `/attempts/user/${id}`),
        ]);
        setCourses(enrollmentsRes.data.map((enrollment) => enrollment.course).filter(Boolean));
        setExams(attemptsRes.data.map((attempt) => attempt.exam).filter(Boolean));
      } catch (error) {
        console.error("Failed to load profile data:", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id, currentUser]);

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
    <div className="cc-public-profile-shell">
      <div className="cc-public-profile-card cc-public-profile-identity">
        <div className="cc-public-profile-cover" style={profile.bannerImage ? { backgroundImage: `url(${profile.bannerImage})` } : undefined} />
        <div className="cc-public-profile-identity-body">
          <img
            src={optimizedImageUrl(profile.profileImage || DEFAULT_AVATAR, 400)}
            alt="Profile"
            className="cc-public-profile-avatar"
          />
          <div className="cc-public-profile-details">
            <h3 className="fw-bold mb-1">{profile.name || profile.username}</h3>
            <span className="cc-public-profile-handle">@{profile.username}</span>
            <div className="cc-public-profile-meta">
              <span className="cc-public-profile-role">{profile.role}</span>
              <span>
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

      <section className="cc-public-profile-section">
      <h4>Posts</h4>
      <div className="row g-4">
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
      </section>

      <section className="cc-public-profile-section">
      <h4>Courses</h4>
      <div className="row g-3">
        {courses.length === 0 && (
          <div className="text-muted ms-2">No courses yet.</div>
        )}
        {courses.map((course) => (
          <div className="col-md-4" key={course._id}>
            <div className="cc-public-profile-card h-100">
              <div className="card-body">
                <h5 className="fw-bold">{course.title}</h5>
                <p className="text-muted">{course.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      </section>

      <section className="cc-public-profile-section">
      <h4>Exams</h4>
      <div className="row g-3">
        {exams.length === 0 && (
          <div className="text-muted ms-2">No exams yet.</div>
        )}
        {exams.map((exam) => (
          <div className="col-md-4" key={exam._id}>
            <div className="cc-public-profile-card h-100">
              <div className="card-body">
                <h5 className="fw-bold">{exam.title}</h5>
                <p className="text-muted">{exam.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      </section>
    </div>
  );
}
