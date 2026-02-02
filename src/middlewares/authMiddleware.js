import { prisma } from "../config/db.js";
import jwt from "jsonwebtoken";

export const authMiddleware = async (req, res, next) => {
	let token;
	if (req.cookies?.jwt) {
		token = req.cookies.jwt;
	}
	if (!token) {
		return res.status(401).json({ message: "Unauthorized, no token" });
	}
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const user = await prisma.user.findUnique({
			where: { id: decoded.id },
		});
		if (!user) {
			return res.status(401).json({ message: "User no long exists" });
		}
		req.user = user;
		next();
	} catch (error) {
		return res.status(401).json({ message: "Unauthorized" });
	}
};
