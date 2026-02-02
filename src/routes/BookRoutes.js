import express from "express";
import {
	addBook,
	updateBook,
	getBooks,
	getAllBooks,
	deleteBook,
	addBooksToUser,
} from "../controllers/bookController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getAllBooks);

router.get("/userBooks/:id", getBooks);

router.post("/add", addBook);

router.put("/", updateBook);

router.put("/addToUser/:id", addBooksToUser);

router.delete("/:id", deleteBook);

export default router;
