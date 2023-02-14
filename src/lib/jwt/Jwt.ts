import type Server from "../Server.js";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";

export class Jwt {
	public encryptionKey!: string;

	public constructor(public server: Server) {}

	/**
	 * Generates a JWT Token valid for 15m
	 * @returns State value as JWT Token for oauth2 applications
	 */
	public generateState() {
		return jwt.sign({ randomToken: Jwt.randomToken() }, this.encryptionKey, { expiresIn: 9e5 });
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
