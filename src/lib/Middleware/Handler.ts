import { join, dirname } from "node:path";
import type Server from "../Server.js";
import { fileURLToPath } from "node:url";
import { statSync, readdirSync } from "node:fs";
import type { Middleware } from "./Middleware.js";
import type { ConstructorType } from "../Api/decorators.js";

export const __dirname = dirname(fileURLToPath(import.meta.url));

export class MiddlewareHandler {
	public middleware = new Map<string, Middleware>();
	public middlewareDirectory = join(__dirname, "..", "..", "middleware");

	public constructor(public server: Server) {}

	/**
	 * Loads all the middleware found in the middleware directory
	 */
	public async start() {
		const middleware = this.getMiddleware(this.middlewareDirectory);
		for await (const route of middleware) {
			await this.loadRoute(route);
		}

		this.server.logger.info(
			`[ApiHandler]: Api middleware loaded (${this.server.server._router.stack.filter((x: any) => x.route && x.route.path).length} routes)`
		);
	}

	/**
	 * Loads middleware using a file path
	 * @param file The path to the file to load
	 */
	private async loadRoute(file: string) {
		try {
			const { default: Handler } = (await import(`${file}.js`)) as MiddlewareFile;
			const middleware = new Handler(this.server, {} as any);

			this.middleware.set(middleware.name, middleware);
		} catch (err) {
			this.server.logger.fatal(`[ApiHandler]: Error while loading middleware `, err);
		}
	}

	/**
	 * \<MiddlewareHandler\>.getRawMiddleware() but filters the data
	 * @param path The directory to read
	 * @returns `string[]` — Array with Middleware
	 */
	private getMiddleware(path: string) {
		try {
			const rawMiddleware = this.getRawMiddleware(path);
			const filteredMiddleware = rawMiddleware.filter((middleware) => middleware.endsWith(".js")).map((route) => route.replace(".js", ""));

			return filteredMiddleware;
		} catch (err) {
			return [];
		}
	}

	/**
	 * Reads the provided middleware directory recursively to get all the files
	 * @param path The directory to read
	 * @param routes An array of already fetched routes
	 * @returns `string[]` — Array with Middleware
	 */
	private getRawMiddleware(path: string, middleware: string[] = []) {
		const files = readdirSync(path);
		for (const file of files) {
			const filePath = join(path, file);

			if (statSync(filePath).isDirectory()) middleware = this.getRawMiddleware(filePath, middleware);
			else middleware.push(filePath);
		}

		return middleware;
	}
}

interface MiddlewareFile {
	default: ConstructorType<ConstructorParameters<typeof Middleware>, Middleware>;
}
