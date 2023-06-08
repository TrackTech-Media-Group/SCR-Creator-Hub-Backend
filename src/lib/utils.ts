import { LogLevel } from "@snowcrystals/icicle";
import type { Options as RateLimitOptions } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { RedisClient } from "./constants.js";
import jwt, { type SignOptions as JwtSignOptions } from "jsonwebtoken";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class Utils {
	/** Returns the appropiate log level based on the running environment */
	public static getLoggerLevel(): LogLevel {
		if (process.env.FORCE_DEBUG_LEVEL === "1") return LogLevel.Debug;
		return process.env.NODE_ENV === "development" ? LogLevel.Debug : LogLevel.Info;
	}

	/**
	 * Returns an array of allowed origins
	 */
	public static getCorsOrigins(): string[] {
		const origins = ["scrcreate.app", "beta.scrcreate.app"];
		return process.env.NODE_ENV === "development" ? [...origins, "http://localhost:3001"] : origins;
	}

	/**
	 * Returns an object with default and (optionally) options from the options param
	 * @param options Additional options that may be added to the object
	 */
	public static getRatelimitOptions(options: Partial<RateLimitOptions> = {}) {
		const RatelimitOptions: Partial<RateLimitOptions> = {
			standardHeaders: true,
			legacyHeaders: true,
			message: { "*": "Too many requests, please try again later." },
			store: new RedisStore({ sendCommand: (...args: string[]) => RedisClient.sendCommand(args) }),
			...options
		};

		return RatelimitOptions;
	}

	/**
	 * Creates a JWT signed token
	 * @param value The value to add the JWT token
	 * @param expiresIn The expiration time in ms
	 */
	public static signJwt(value: Record<string, any>, options?: JwtSignOptions) {
		return jwt.sign(value, process.env.INTERNAL_ENCRYPTION_KEY, options);
	}

	/**
	 * Encryptes the provided string
	 * @param value The string to encrypt
	 */
	public static encryptJwt(value: string): string {
		const iv = randomBytes(16);

		const cipher = createCipheriv("aes-256-ctr", Buffer.from(process.env.INTERNAL_ENCRYPTION_KEY), iv);
		const encrypted = Buffer.concat([cipher.update(value), cipher.final()]);

		return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
	}

	/**
	 * Decryptes the provided string
	 * @param hash The string to decrypt
	 */
	public static decryptJwt(hash: string): string {
		const [iv, encrypted] = hash.split(":");

		const decipher = createDecipheriv("aes-256-ctr", process.env.INTERNAL_ENCRYPTION_KEY, Buffer.from(iv, "hex"));
		const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted, "hex")), decipher.final()]);
		const token = decrypted.toString();

		return token;
	}

	/**
	 * Generates a JWT Token valid for 15m
	 * @returns State value as JWT Token for oauth2 applications
	 */
	public static generateAuthState() {
		const randomToken = this.randomToken();
		const jwtToken = this.signJwt({ randomToken, type: "auth-state" }, { expiresIn: 9e5 });

		return {
			token: jwtToken,
			state: randomToken
		};
	}

	/**
	 * Generates a JWT CSRF-Token
	 */
	public static generateCsrf() {
		const randomToken = this.randomToken();
		const jwtToken = this.signJwt({ randomToken, type: "csrf-state" });

		return {
			token: jwtToken,
			state: randomToken
		};
	}

	/**
	 * Creates a session token
	 * @param userId The userId
	 * @param expiresIn The expiration time in ms
	 */
	public static generateSessionToken(userId: string, expiresIn: number) {
		const token = this.randomToken(64);
		const session = this.signJwt({ session: token, userId }, { expiresIn });

		return {
			session,
			token
		};
	}

	/**
	 * Verifies the auth JWT token and state
	 * @param cookie The XSRF-STATE-COOKIE cookie from the request
	 * @param query The STATE query token from the request
	 */
	public static verifyAuthState(cookie: string, query: string) {
		try {
			const decoded = jwt.verify(cookie, process.env.INTERNAL_ENCRYPTION_KEY, { ignoreExpiration: false });
			if (typeof decoded !== "object") return false;

			return decoded.randomToken === query && decoded.type === "auth-state";
		} catch (err) {
			return false;
		}
	}

	/**
	 * Verifies the CSRF JWT token and state
	 * @param cookie The XSRF-STATE-COOKIE cookie from the request
	 * @param query The STATE query token from the request
	 */
	public static verifyCsrfState(cookie: string, query: string) {
		try {
			const decoded = jwt.verify(cookie, process.env.INTERNAL_ENCRYPTION_KEY, { ignoreExpiration: false });
			if (typeof decoded !== "object") return false;

			return decoded.randomToken === query && decoded.type === "csrf-state";
		} catch (err) {
			return false;
		}
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
