import { Utils } from "#lib/utils.js";
import { Logger } from "@snowcrystals/icicle";
import { bold } from "colorette";

const logger = new Logger({ name: "Performance", level: Utils.getLoggerLevel() });

/**
 * Decorator for measuring the performance of a class method
 */
export default function MeasurePerformance(name?: string) {
	return (_target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
		if (!(descriptor.value instanceof Function)) throw new Error("Decorator only supports methods.");

		const originalMethod = descriptor.value as (...args: any[]) => unknown;

		descriptor.value = async function value(this: any, ...args: any[]) {
			const start = performance.now();

			await originalMethod.apply(this, args);
			const end = performance.now();

			const displayName = `${name || this}#${propertyKey}()`;
			logger.debug(`Performance result for ${bold(displayName)}: call took ${bold(end - start)} ms`);
		};

		return descriptor;
	};
}
