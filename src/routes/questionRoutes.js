import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
	getQuestions,
	addQuestion,
	editQuestion,
} from "../controllers/questionController.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/:bookId", getQuestions);

router.post("/:bookId/chapter/:chapterId", addQuestion);

router.put("/:questionId", editQuestion);

export default router;
