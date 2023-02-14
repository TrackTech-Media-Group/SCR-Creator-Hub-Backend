import { randomBytes } from "node:crypto";

export const DEFAULT_RAW_ENV = {
	PORT: "3000",
	INTERNAL_API_KEY: () => randomBytes(32).toString("hex"),
	ENCRYPTION_KEY: () => randomBytes(32).toString("hex")
} as const;

export interface EnvConfig {
	port: number;
	internalApiKey: string;
	encryptionKey: string;
}
