import { randomBytes } from "node:crypto";

export const DEFAULT_RAW_ENV = {
	PORT: "3000",
	INTERNAL_API_KEY: () => randomBytes(32).toString("hex"),
	ENCRYPTION_KEY: () => randomBytes(32).toString("hex").slice(0, 32),
	DISCORD_CLIENT_ID: "",
	DISCORD_CLIENT_SECRET: "",
	DISCORD_CALLBACK_URL: "http://localhost:3001/auth/callback",
	DATABASE_URL: "postgresql://myuser:mypassword@localhost:5432/db?schema=public",
	UPLOAD_API: "https://creatorhub-dev-cdn.dnkl.xyz",
	UPLOAD_API_KEY: ""
} as const;

export interface EnvConfig {
	port: number;
	internalApiKey: string;
	encryptionKey: string;
	upload: {
		api: string;
		key: string;
	};
	discord: {
		id: string;
		secret: string;
		callback: string;
	};
}
