import express from "express";
import { prisma } from "../config/db.js";

const router = express.Router();

// GET /debug/db -> tries to connect and disconnect the Prisma client and returns detailed error
router.get("/db", async (req, res) => {
	try {
		await prisma.$connect();
		await prisma.$disconnect();
		return res.json({ ok: true, message: "Connected to DB successfully" });
	} catch (e) {
		console.error("Debug DB connection error:", e);
		// Provide helpful fields for diagnosis
		return res.status(500).json({
			message: "DB connection failed",
			error: e?.message ?? String(e),
			meta: e?.meta ?? null,
		});
	}
});

export default router;