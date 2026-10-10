import express from "express";
import { protect, requireRole } from "../middleware/auth.middleware.js";
import {
  listManagedUsers,
  createManagedUser,
  getManagedUser,
  updateManagedUser,
  deactivateManagedUser,
  updateUserPermissions,
  getRbacStats,
} from "../controllers/rbac.controller.js";

const router = express.Router();

// All RBAC admin routes require authentication + super_admin role
router.use(protect, requireRole("super_admin", "admin"));

router.get("/stats",              getRbacStats);
router.get("/users",              listManagedUsers);
router.post("/users",             createManagedUser);
router.get("/users/:id",          getManagedUser);
router.put("/users/:id",          updateManagedUser);
router.delete("/users/:id",       deactivateManagedUser);
router.patch("/users/:id/permissions", updateUserPermissions);

export default router;
