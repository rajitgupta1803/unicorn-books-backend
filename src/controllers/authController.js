import { prisma } from "../config/db.js";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";

const registerUser = async (req, res) => {
	const { name, email, password } = req.body;
	let userExists = null;

	// Check if user already exists

	userExists = await prisma.user.findFirst({
		where: { email: email },
	});

	if (userExists) {
		return res
			.status(400)
			.json({ error: "User already exists with this email" });
	}

	// Hash Password
	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password, salt);

	// Create User

	const user = await prisma.user.create({
		data: {
			name,
			email,
			password: hashedPassword,
			role: Role.USER,
		},
	});
	return res
		.status(201)
		.json({ message: "User registered successfully", user });
};

const registerAdmin = async (req, res) => {
	const { name, email, password, role } = req.body;
	let userExists = null;
	if (role != Role.ADMIN) {
		return res
			.status(403)
			.json({ error: "Only admin role can be registered here" });
	}
	// Check if user already exists
	userExists = await prisma.user.findFirst({
		where: { email: email },
	});
	if (userExists) {
		return res
			.status(400)
			.json({ error: "User already exists with this email" });
	}
	// Hash Password
	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password, salt);
	// Create User
	const user = await prisma.user.create({
		data: {
			name,
			email,
			password: hashedPassword,
			role,
		},
	});
	return res
		.status(201)
		.json({ message: "Admin registered successfully", user });
};

const loginUser = async (req, res) => {
	const { email, password } = req.body;
	// Find user by email
	const user = await prisma.user.findFirst({
		where: { email: email },
	});
	if (!user) {
		return res.status(400).json({ error: "No such User" });
	}
	if (user.role != Role.USER) {
		return res.status(403).json({ error: "Login only for Schools" });
	}
	// Compare passwords
	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) {
		return res.status(400).json({ error: "Invalid password" });
	}

	const token = generateToken(user, res);

	// Successful login
	return res
		.status(200)
		.json({ message: "School Login successful", user, token });
};

const loginAdmin = async (req, res) => {
	const { email, password } = req.body;
	// Find user by email
	const user = await prisma.user.findFirst({
		where: { email: email },
	});
	if (!user) {
		return res.status(400).json({ error: "No such Admin" });
	}
	if (user.role != Role.ADMIN) {
		return res.status(403).json({ error: "Login only for Admins" });
	}
	// Compare passwords
	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) {
		return res.status(400).json({ error: "Invalid password" });
	}

	const token = generateToken(user, res);

	// Successful login
	return res
		.status(200)
		.json({ message: "Admin Login successful", user, token });
};

const logout = async (req, res) => {
	res.cookie("jwt", "", {
		httpOnly: true,
		expires: new Date(0),
	});
	return res.status(200).json({ message: "Logged out successfully" });
};

const getSchools = async (req, res) => {
	if (!req.user) {
		return res.status(401).json({ error: "Not Logged In" });
	} else if (req.user.role !== Role.ADMIN) {
		return res
			.status(403)
			.json({ error: "Only Admins can access this page" });
	}
	try {
		const schools = await prisma.user.findMany({
			where: { role: Role.USER },
		});
		return res.status(200).json(schools);
	} catch (error) {
		console.error("Error fetching schools:", error);
		return res.status(500).json({ error: "Failed to fetch schools" });
	}
};

const deleteUser = async (req, res) => {
	if (!req.user) {
		return res.status(401).json({ error: "Not Logged In" });
	} else if (req.user.role !== Role.ADMIN) {
		return res.status(403).json({ error: "Only Admins can delete users" });
	}
	const userId = req.params.id;
	try {
		// Check if user exists
		const user = await prisma.user.findUnique({
			where: { id: userId },
		});
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}
		// Delete user
		await prisma.user.delete({
			where: { id: userId },
		});
		return res.status(200).json({ message: "User deleted successfully" });
	} catch (error) {
		console.error("Error deleting user:", error);
		return res.status(500).json({ error: "Failed to delete user" });
	}
};

export {
	registerUser,
	registerAdmin,
	loginUser,
	loginAdmin,
	logout,
	getSchools,
	deleteUser,
};
