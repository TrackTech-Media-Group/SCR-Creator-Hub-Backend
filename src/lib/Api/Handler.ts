import { join, dirname } from "node:path";
import type Server from "../Server.js";
import { fileURLToPath } from "node:url";
import { statSync, readdirSync } from "node:fs";
import type { ApiRoute } from "./ApiRoute.js";
import type { ConstructorType } from "./decorators.js";
import type { ApiMethods } from "./types.js";
import { bold } from "colorette";

export const __dirname = dirname(fileURLToPath(import.meta.url));

export class ApiHandler {
	public apiDirectory = join(__dirname, "..", "..", "routes");

	public constructor(public server: Server) {}

	/**
	 * Loads all the routes found in the routes directory
	 */
	public async start() {
		const routes = this.getRoutes(this.apiDirectory);
		for await (const route of routes) {
			await this.loadRoute(route);
		}

		this.server.logger.info("[ApiHandler]: Api routes loaded.");
	}

	/**
	 * Loads a route using a file path
	 * @param file The path to the file to load
	 */
	private async loadRoute(file: string) {
		const route = this.parseRoute(file);

		try {
			const { default: Handler } = (await import(`${file}.js`)) as ApiRouteFile;
			const apiRoute = new Handler(this.server, {} as any);

			const { methods, middleware } = apiRoute.getRouteData();
			methods.forEach((_method) => {
				const method = _method.toLowerCase() as Lowercase<ApiMethods>;
				this.server.server[method](`/api${route}`, ...middleware, apiRoute.run.bind(apiRoute));
			});
		} catch (err) {
			this.server.logger.fatal(`[ApiHandler]: Error while loading route: ${bold(route)} `, err);
		}
	}

	/**
	 * \<ApiHandler\>.getRawRoutes() but filters the data
	 * @param path The directory to read
	 * @returns `string[]` — Array with routes
	 */
	private getRoutes(path: string) {
		const rawRoutes = this.getRawRoutes(path);
		const filteredRoutes = rawRoutes.filter((route) => route.endsWith(".js")).map((route) => route.replace(".js", ""));

		return filteredRoutes;
	}

	/**
	 * Reads the provided routes directory recursively to get all the files
	 * @param path The directory to read
	 * @param routes An array of already fetched routes
	 * @returns `string[]` — Array with routes
	 */
	private getRawRoutes(path: string, routes: string[] = []) {
		const files = readdirSync(path);
		for (const file of files) {
			const filePath = join(path, file);

			if (statSync(filePath).isDirectory()) routes = this.getRawRoutes(filePath, routes);
			else routes.push(filePath);
		}

		return routes;
	}

	/**
	 * Parses the file path and returns an Express friendly route
	 * @param path the file path of the provided file
	 */
	private parseRoute(path: string) {
		path = path.replace(this.apiDirectory, "");
		path = path.replace(/\[(.*?)\]/g, ":$1");
		if (path.endsWith("index")) path = path.slice(0, path.length - 5);

		return path;
	}
}

interface ApiRouteFile {
	default: ConstructorType<ConstructorParameters<typeof ApiRoute>, ApiRoute>;
}
