import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.js";

// Profile uploader (keeps your existing)
export const uploadProfile = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "online-exam/profile-images",
      allowed_formats: ["jpg", "jpeg", "png"],
      transformation: [{ width: 300, height: 300, crop: "limit" }],
    },
  }),
});

// Course images (keeps your existing)
const courseStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "online-exam/course-images",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 800, height: 600, crop: "limit" }],
  },
});
export const uploadCourseImage = multer({ storage: courseStorage });

// NEW: posts uploader (Cloudinary)
const postStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "online-exam/post-images",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    transformation: [{ width: 1600, crop: "limit" }],
  },
});
export const upload = multer({ storage: postStorage });
// ...existing code...