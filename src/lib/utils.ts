import { LogLevel } from "@snowcrystals/icicle";
import type { Options as RateLimitOptions } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { RedisClient } from "./constants.js";

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
}
