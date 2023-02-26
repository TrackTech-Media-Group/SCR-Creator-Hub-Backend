import type Server from "../Server.js";
import type { Middleware, MiddlewareOptions } from "./Middleware.js";

/**
 * Creates a new proxy to efficiently add properties to class without creating subclasses
 * @param target The constructor of the class to modify
 * @param handler The handler function to modify the constructor behavior for the target
 * @hidden
 */
function createProxy<T extends object>(target: T, handler: Omit<ProxyHandler<T>, "get">): T {
	return new Proxy(target, {
		...handler,
		get: (target, property) => {
			const value = Reflect.get(target, property);
			return typeof value === "function" ? (...args: readonly unknown[]) => value.apply(target, args) : value;
		}
	});
}

/**
 * Create a class Decorator with easy typings
 * @hidden
 */
function createClassDecorator<F extends TFunction>(fn: F): ClassDecorator {
	return fn;
}

type ConstructorType<Args extends readonly any[] = readonly any[], Res = any> = new (...args: Args) => Res;
type ApplyOptionsParam<T> = T | ((server: Server) => T);
type TFunction = (...args: any[]) => void;

/**
 * Applies the ApiRouteOptions to an ApiRoute extended class
 * @param result The ApiRouteOptions or a function to get the ApiRouteOptions from
 */
export function ApplyMiddlewareOptions<Options extends MiddlewareOptions>(result: ApplyOptionsParam<Options>): ClassDecorator {
	const getOptions = (server: Server) => (typeof result === "function" ? result(server) : result);

	return createClassDecorator((target: ConstructorType<ConstructorParameters<typeof Middleware>, Middleware>) =>
		createProxy(target, {
			construct: (constructor, [client, baseOptions = {}]: [Server, Partial<Options>]) =>
				new constructor(client, { ...baseOptions, ...getOptions(client) })
		})
	);
}