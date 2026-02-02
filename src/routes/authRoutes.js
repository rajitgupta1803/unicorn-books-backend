import express from "express";
import {
	registerUser,
	registerAdmin,
	loginAdmin,
	loginUser,
	logout,
	getSchools,
	deleteUser,
} from "../controllers/authController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", (req, res) => {
	res.json({ message: "Hello, World!" });
});

router.get("/schools", authMiddleware, getSchools);

router.post("/registerUser", registerUser);

router.post("/registerAdmin", registerAdmin);

router.post("/loginUser", loginUser);

router.post("/loginAdmin", loginAdmin);

router.post("/logout", authMiddleware, logout);

router.delete("/deleteUser/:id", authMiddleware, deleteUser);

export default router;
