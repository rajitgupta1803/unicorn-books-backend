import jwt from "jsonwebtoken";

export const generateToken = (user, res) => {
	const payload = { id: user.id, role: user.role };
	const token = jwt.sign(payload, process.env.JWT_SECRET, {
		expiresIn: "7d",
	});

	res.cookie("jwt", token, {
		httpOnly: true,
		secure: true, // Set to true only in production
		sameSite: "none", // Prevent against CSRF attack
		maxAge: 1000 * 60 * 60 * 24 * 7, // in miliseconds
	});

	return token;
};
