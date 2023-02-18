import type Server from "../Server.js";
import jwt from "jsonwebtoken";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export class Jwt {
	public encryptionKey!: string;

	public constructor(public server: Server) {}

	/**
	 * Creates a JWT signed token
	 * @param value The value to add the JWT token
	 * @param expiresIn The expiration time in ms
	 */
	public sign(value: Record<string, any>, expiresIn: number) {
		return jwt.sign(value, this.encryptionKey, { expiresIn });
	}

	/**
	 * Encryptes the provided string
	 * @param value The string to encrypt
	 */
	public encrypt(value: string): string {
		const iv = randomBytes(16);

		const cipher = createCipheriv("aes-256-ctr", this.encryptionKey, iv);
		const encrypted = Buffer.concat([cipher.update(value), cipher.final()]);

		return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
	}

	/**
	 * Decryptes the provided string
	 * @param hash The string to decrypt
	 */
	public decrypt(hash: string): string {
		const [iv, encrypted] = hash.split(":");

		const decipher = createDecipheriv("aes-256-ctr", this.encryptionKey, Buffer.from(iv, "hex"));
		const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted, "hex")), decipher.final()]);
		const token = decrypted.toString();

		return token;
	}

	/**
	 * Generates a JWT Token valid for 15m
	 * @returns State value as JWT Token for oauth2 applications
	 */
	public generateState() {
		const randomToken = Jwt.randomToken();

		return {
			token: jwt.sign({ randomToken, type: "state" }, this.encryptionKey, { expiresIn: 9e5 }),
			state: randomToken
		};
	}

	/**
	 * Checks the JWT State Token
	 * @param cookie The XSRF-STATE-COOKIE cookie from the request
	 * @param query The STATE query token from the request
	 * @returns Boolean
	 */
	public checkState(cookie: string, query: string) {
		try {
			const decoded = jwt.verify(cookie, this.encryptionKey, { ignoreExpiration: false });
			if (typeof decoded !== "object") return false;

			return decoded.randomToken === query;
		} catch (err) {
			return false;
		}
	}

	/**
	 * @hidden internal function
	 */
	public load() {
		this.encryptionKey = this.server.config.config.encryptionKey;
	}

	/**
	 * Generates a cryptographically strong random string
	 * @param size The number of bytes to generate
	 * @returns String representation of a Buffer with bytes
	 */
	public static randomToken(size = 32) {
		return randomBytes(size).toString("hex");
	}
}
