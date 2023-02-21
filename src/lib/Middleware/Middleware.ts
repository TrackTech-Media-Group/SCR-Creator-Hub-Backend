import type { NextFunction, Request, Response } from "express";
import type Server from "../Server.js";

export class Middleware implements MiddlewareOptions {
	public name: string;

	public constructor(public server: Server, options: MiddlewareOptions) {
		if (typeof options.name !== "string") throw new Error("Middleware: incorrect name provided!");
		this.name = options.name;
	}

	/**
	 * The function which is called when the Middleware is called
	 * @param req The Express Request object
	 * @param res The Express Response object
	 * @param next The Express NextFunction function
	 * @returns Promise\<void\> | void
	 */
	public run(req: Request, res: Response, next: NextFunction): Promise<void> | void {
		res.send("Hello World!");
	}
}

export interface MiddlewareOptions {
	name: string;
}
