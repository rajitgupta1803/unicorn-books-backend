import { prisma } from "../config/db.js";
import multer from "multer";
import sharp from "sharp";
import cloudinary from "../cloudinary.js"; // adjust path

export const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadResizedImage = async (buffer) => {
	const resized = await sharp(buffer)
		.resize(120, 182, { fit: "cover" })
		.toBuffer();

	return await new Promise((resolve, reject) => {
		const stream = cloudinary.uploader.upload_stream(
			{ folder: "books" },
			(err, result) => {
				if (err) reject(err);
				else resolve(result);
			},
		);
		stream.end(resized);
	});
};

const addBook = async (req, res) => {
	try {
		const { title, author } = req.body;
		const chapters = JSON.parse(req.body.chapters || "[]");

		const exists = await prisma.book.findFirst({
			where: { title },
		});

		if (exists) {
			return res.status(400).json({ error: "Book already exists" });
		}

		let imageUrl = null;
		let imageId = null;

		if (req.file) {
			const result = await uploadResizedImage(req.file.buffer);
			imageUrl = result.secure_url;
			imageId = result.public_id;
		}

		const cleanChapters = chapters.map(({ title }) => ({ title }));

		const book = await prisma.book.create({
			data: {
				title,
				author,
				imageUrl,
				imageId,
				chapters: {
					create: cleanChapters,
				},
			},
			include: { chapters: true },
		});

		return res.status(201).json({
			message: "Book added successfully",
			book,
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Failed to add book" });
	}
};

const getAllBooks = async (req, res) => {
	if (!req.user || req.user.role !== "ADMIN") {
		return res.status(403).json({ error: "Access denied" });
	}
	try {
		const books = await prisma.book.findMany({
			include: {
				chapters: true,
			},
		});
		return res.json(books);
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Failed to fetch books" });
	}
};

const getBooks = async (req, res) => {
	if (!req.user) {
		return res
			.status(403)
			.json({ error: "Access denied, login as school again" });
	}
	try {
		const userId = req.params.id;

		const userWithBooks = await prisma.user.findUnique({
			where: { id: userId },
			include: {
				books: {
					include: {
						book: {
							include: {
								chapters: true,
							},
						},
					},
				},
			},
		});

		const books = userWithBooks.books.map((ub) => ub.book);

		return res.status(200).json(books);
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Failed to fetch books" });
	}
};

const updateBook = async (req, res) => {
	try {
		const { title, author } = req.body;
		const { id } = req.params;
		const chapters = JSON.parse(req.body.chapters || "[]");

		const existing = await prisma.book.findUnique({
			where: { id },
		});

		if (!existing) {
			return res.status(404).json({ error: "Book not found" });
		}

		let imageUrl = existing.imageUrl;
		let imageId = existing.imageId;

		if (req.file) {
			const result = await uploadResizedImage(req.file.buffer);

			if (existing.imageId) {
				await cloudinary.uploader.destroy(existing.imageId);
			}

			imageUrl = result.secure_url;
			imageId = result.public_id;
		}

		const book = await prisma.book.update({
			where: { id },
			data: {
				title,
				author,
				imageUrl,
				imageId,
				chapters: {
					deleteMany: {},
					create: chapters.map(({ title }) => ({ title })),
				},
			},
			include: { chapters: true },
		});

		return res.status(200).json({
			message: "Book updated successfully",
			book,
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Failed to update book" });
	}
};

const deleteBook = async (req, res) => {
	try {
		const { id } = req.params;

		const existing = await prisma.book.findUnique({
			where: { id },
		});

		if (!existing) {
			return res.status(404).json({ error: "Book not found" });
		}

		if (existing.imageId) {
			await cloudinary.uploader.destroy(existing.imageId);
		}

		await prisma.book.delete({
			where: { id },
		});

		return res.status(200).json({
			message: "Book deleted successfully",
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Failed to delete book" });
	}
};

const addBooksToUser = async (req, res) => {
	const userId = req.params.id;
	const { bookIds } = req.body; // array of UUIDs

	if (!Array.isArray(bookIds)) {
		return res.status(400).json({ error: "bookIds must be an array" });
	}

	try {
		await prisma.$transaction([
			// 1) Remove books NOT in new list
			prisma.userBook.deleteMany({
				where: {
					userId,
					NOT: { bookId: { in: bookIds } },
				},
			}),

			// 2) Add missing books
			prisma.userBook.createMany({
				data: bookIds.map((bookId) => ({ userId, bookId })),
				skipDuplicates: true,
			}),
		]);

		return res.json({ message: "User books synced" });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: err.message });
	}
};

export {
	addBook,
	getAllBooks,
	getBooks,
	updateBook,
	deleteBook,
	addBooksToUser,
};
