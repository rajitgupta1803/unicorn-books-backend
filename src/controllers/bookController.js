import { prisma } from "../config/db.js";

const addBook = async (req, res) => {
	const { title, author, chapters } = req.body;
	const exists = await prisma.book.findFirst({
		where: { title: title },
	});
	if (exists) {
		return res.status(400).json({ error: "Book already exists" });
	}

	const cleanChapters = chapters.map(({ title }) => ({ title }));

	const book = await prisma.book.create({
		data: {
			title,
			author,
			chapters: {
				create: cleanChapters,
			},
		},
	});
	return res.status(201).json({ message: "Book added successfully", book });
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
	const { id, title, author, chapters } = req.body;
	try {
		const book = await prisma.book.update({
			where: { id: id },
			data: {
				title,
				author,
				chapters: {
					deleteMany: {},
					create: chapters.map(({ title }) => ({ title })),
				},
			},
			include: {
				chapters: true,
			},
		});
		return res
			.status(200)
			.json({ message: "Book updated successfully", book });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Failed to update book" });
	}
};

const deleteBook = async (req, res) => {
	const { id } = req.params;
	try {
		await prisma.book.delete({
			where: { id: id },
		});
		return res.status(200).json({ message: "Book deleted successfully" });
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
