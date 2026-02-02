import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const connectDB = async () => {
	try {
		await prisma.$connect();
		console.log("Database connected successfully");
	} catch (error) {
		console.error("Database connection failed:", error);
		process.exit(1);
	}
};

const disconnectDB = async () => {
	try {
		await prisma.$disconnect();
		console.log("Database disconnected successfully");
	} catch (error) {
		console.error("Database disconnection failed:", error);
	}
};

export { prisma, connectDB, disconnectDB };
