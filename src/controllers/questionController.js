import { prisma } from "../config/db.js";
import { Role } from "@prisma/client";

const readableToPrismaType = {
	MCQ: "MCQ",
	"Fill in the Blanks": "FILL_IN_THE_BLANK",
	"Long Answer Questions": "LONG_ANSWER",
	"True or False Questions": "TRUE_FALSE",
};

const prismaToReadableType = {
	MCQ: "MCQ",
	FILL_IN_THE_BLANK: "Fill in the Blanks",
	LONG_ANSWER: "Long Answer Questions",
	TRUE_FALSE: "True or False Questions",
};

const getQuestions = async (req, res) => {
	try {
		const { bookId } = req.params;
		const { chapterIds, types } = req.body;

		if (!Array.isArray(chapterIds) || chapterIds.length === 0) {
			return res
				.status(400)
				.json({ error: "chapterIds must be a non-empty array" });
		}

		if (!Array.isArray(types) || types.length === 0) {
			return res
				.status(400)
				.json({ error: "types must be a non-empty array" });
		}

		// Convert readable types to Prisma enum types
		const prismaTypes = types
			.map((type) => readableToPrismaType[type])
			.filter(Boolean);

		if (prismaTypes.length === 0) {
			return res
				.status(400)
				.json({ error: "Invalid question types provided" });
		}

		const questions = await prisma.question.findMany({
			where: {
				bookId,
				chapterId: { in: chapterIds },
				type: { in: prismaTypes },
			},
		});

		// Convert DB enum back to readable type before sending
		const formattedQuestions = questions.map((q) => ({
			...q,
			type: prismaToReadableType[q.type],
		}));

		// Group by readable type
		const grouped = {
			MCQ: [],
			"Fill in the Blanks": [],
			"Long Answer Questions": [],
			"True or False Questions": [],
		};

		formattedQuestions.forEach((q) => {
			grouped[q.type].push(q);
		});

		res.status(200).json(grouped);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal server error" });
	}
};

const addQuestion = async (req, res) => {
	if (!req.user || req.user.role !== "ADMIN")
		return res.status(400).json({ error: "Not Authorized" });
	try {
		const { bookId, chapterId } = req.params;
		const { question, answer, type, options } = req.body;

		// Basic validation
		if (!question || !answer || !type) {
			return res.status(400).json({
				error: "question, answer and type are required",
			});
		}

		const prismaType = readableToPrismaType[type];

		if (!prismaType) {
			return res.status(400).json({
				error: "Invalid question type",
			});
		}

		// MCQ validation
		if (prismaType === "MCQ") {
			if (!Array.isArray(options) || options.length !== 4) {
				return res.status(400).json({
					error: "MCQ must have exactly 4 options",
				});
			}
		}

		// Ensure chapter belongs to book
		const chapter = await prisma.chapter.findFirst({
			where: {
				id: chapterId,
				bookId: bookId,
			},
		});

		if (!chapter) {
			return res.status(404).json({
				error: "Chapter not found for this book",
			});
		}

		const newQuestion = await prisma.question.create({
			data: {
				question,
				answer,
				type: prismaType,
				options: prismaType === "MCQ" ? options : [],
				bookId,
				chapterId,
			},
		});

		// Convert type back to readable before sending
		const formatted = {
			...newQuestion,
			type: prismaToReadableType[newQuestion.type],
		};

		res.status(201).json(formatted);
	} catch (error) {
		console.error(error);
		res.status(500).json({
			error: "Internal server error",
		});
	}
};

const editQuestion = async (req, res) => {
	try {
		const { questionId } = req.params;
		const { question, answer, type, options } = req.body;

		// Find existing question
		const existing = await prisma.question.findUnique({
			where: { id: questionId },
		});

		if (!existing) {
			return res.status(404).json({
				error: "Question not found",
			});
		}

		// Determine updated type
		let prismaType = existing.type;

		if (type) {
			const mapped = readableToPrismaType[type];

			if (!mapped) {
				return res.status(400).json({
					error: "Invalid question type",
				});
			}

			prismaType = mapped;
		}

		// Validate MCQ rules
		if (prismaType === "MCQ") {
			if (!Array.isArray(options) || options.length !== 4) {
				return res.status(400).json({
					error: "MCQ must have exactly 4 options",
				});
			}
		}

		const updated = await prisma.question.update({
			where: { id: questionId },
			data: {
				question: question ?? existing.question,
				answer: answer ?? existing.answer,
				type: prismaType,
				options: prismaType === "MCQ" ? options : [],
			},
		});

		const formatted = {
			...updated,
			type: prismaToReadableType[updated.type],
		};

		res.status(200).json(formatted);
	} catch (error) {
		console.error(error);
		res.status(500).json({
			error: "Internal server error",
		});
	}
};

const deleteQuestion = async (req, res) => {
	try {
		const { questionId } = req.params;

		if (!questionId) {
			return res.status(400).json({
				error: "Question ID is required",
			});
		}

		// Check if question exists
		const existing = await prisma.question.findUnique({
			where: { id: questionId },
		});

		if (!existing) {
			return res.status(404).json({
				error: "Question not found",
			});
		}

		await prisma.question.delete({
			where: { id: questionId },
		});

		res.status(200).json({
			message: "Question deleted successfully",
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			error: "Internal server error",
		});
	}
};

export { getQuestions, addQuestion, editQuestion, deleteQuestion };
