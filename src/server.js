import "dotenv/config";
import express from "express";
import { connectDB, disconnectDB } from "./config/db.js";
import cors from "cors";
import cookieParser from "cookie-parser";

//import routes
import bookRoutes from "./routes/BookRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
const start = async () => {
	await connectDB();
};
start();

const app = express();

// Source - https://stackoverflow.com/a/46988108
// Posted by Rakesh, modified by community. See post 'Timeline' for change history
// Retrieved 2026-01-26, License - CC BY-SA 4.0

app.use(
	cors({
		origin: true,
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	}),
);

app.use(cookieParser());

//Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/books", bookRoutes);
app.use("/auth", authRoutes);
app.use("/questions", questionRoutes);

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});

// Handle unhandled promise rejections (e.g., database connection errors)
process.on("unhandledRejection", (err) => {
	console.error("Unhandled Rejection:", err);
	server.close(async () => {
		await disconnectDB();
		process.exit(1);
	});
});

// Handle uncaught exceptions
process.on("uncaughtException", async (err) => {
	console.error("Uncaught Exception:", err);
	await disconnectDB();
	process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
	console.log("SIGTERM received, shutting down gracefully");
	server.close(async () => {
		await disconnectDB();
		process.exit(0);
	});
});
