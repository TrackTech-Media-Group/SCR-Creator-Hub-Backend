import { randomBytes } from "node:crypto";

export const DEFAULT_RAW_ENV = {
	PORT: "3000",
	INTERNAL_API_KEY: () => randomBytes(32).toString("hex"),
	ENCRYPTION_KEY: () => randomBytes(32).toString("hex"),
	DISCORD_CLIENT_ID: "",
	DISCORD_CLIENT_SECRET: "",
	DATABASE_URL: "postgresql://myuser:mypassword@localhost:5432/db?schema=public"
} as const;

export interface EnvConfig {
	port: number;
	internalApiKey: string;
	encryptionKey: string;
	discord: {
		id: string;
		secret: string;
	};
}
