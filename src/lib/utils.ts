import { LogLevel } from "@snowcrystals/icicle";

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class Utils {
	/** Returns the appropiate log level based on the running environment */
	public static getLoggerLevel(): LogLevel {
		if (process.env.FORCE_DEBUG_LEVEL === "1") return LogLevel.Debug;
		return process.env.NODE_ENV === "development" ? LogLevel.Debug : LogLevel.Info;
	}
}
