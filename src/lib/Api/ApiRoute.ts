import type { NextFunction, Request, Response } from "express";
import type Server from "../Server.js";
import type { ApiMethods } from "./types.js";

export class ApiRoute implements ApiRouteOptions {
	public methods: ApiMethods | ApiMethods[] = [];
	public middleware: string[] = [];

	public constructor(public server: Server, options: ApiRouteOptions) {
		if (typeof options.methods !== "string" && !Array.isArray(options.methods)) throw new Error("ApiRoute: incorrect methods provided!");
		this.methods = options.methods;

		if (typeof options.middleware !== "undefined" && !Array.isArray(options.middleware))
			throw new Error("ApiRoute: incorrect Middleware provided!");
		this.middleware = options.middleware ?? [];
	}

	/**
	 * The function which is called when the ApiRoute is visited
	 * @param req The Express Request object
	 * @param res The Express Response object
	 * @param next The Express NextFunction function
	 * @returns Promise\<void\> | void
	 */
	public run(req: Request, res: Response, next: NextFunction): Promise<void> | void {
		res.send("Hello World!");
	}

	/**
	 * Returns object with necessary Express route data
	 * @returns Object
	 */
	public getRouteData() {
		return {
			methods: typeof this.methods === "string" ? [this.methods] : this.methods,
			middleware: this.middleware
				.map((middleware) => this.server.middleware.middleware.get(middleware))
				.filter((middleware) => typeof middleware !== "undefined")
				.map((middleware) => middleware!.run.bind(middleware!))
		};
	}
}

export interface ApiRouteOptions {
	methods: ApiMethods | ApiMethods[];
	middleware?: string[];
}
