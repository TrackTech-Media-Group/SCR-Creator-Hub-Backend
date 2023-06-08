import { Utils } from "#lib/utils.js";
import { Logger } from "@snowcrystals/icicle";
import { bold } from "colorette";

const logger = new Logger({ name: "Performance", level: Utils.getLoggerLevel() });

/**
 * Decorator for measuring the performance of a class method
 * @property name Alternative name for the function
 * @property async Whether the function is async or not
 */
export default function MeasurePerformance({ name, async }: { name?: string; async?: boolean } = {}) {
	return (_target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor): PropertyDescriptor => {
		if (!(descriptor.value instanceof Function)) throw new Error("Decorator only supports methods.");

		const originalMethod = descriptor.value as (...args: any[]) => unknown;
		const propertyKeyName = typeof propertyKey === "symbol" ? propertyKey.toString() : propertyKey;

		async function asyncCall(this: any, ...args: any[]) {
			const start = performance.now();
			const result = await originalMethod.apply(this, args);
			const end = performance.now();

			const displayName = `${name || this}#${propertyKeyName}()`;
			logger.debug(`Performance result for ${bold(displayName)}: call took ${bold(end - start)} ms`);

			return result;
		}

		function syncCall(this: any, ...args: any[]) {
			const start = performance.now();
			const result = originalMethod.apply(this, args);
			const end = performance.now();

			const displayName = name || `${this}#${propertyKeyName}()`;
			logger.debug(`Performance result for ${bold(displayName)}: call took ${bold(end - start)} ms`);

			return result;
		}

		descriptor.value = async ? asyncCall : syncCall;
		return descriptor;
	};
}
