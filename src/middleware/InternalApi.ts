import type { CreatorHubServer } from "#lib/Server.js";
import { ApiError } from "#errors/ApiError.js";
import { ApplyOptions, Middleware, methods } from "@snowcrystals/highway";
import { HttpStatusCode } from "axios";
import type { NextFunction, Request, Response } from "express";

@ApplyOptions<Middleware.Options>({ id: "internal-api" })
export default class extends Middleware<CreatorHubServer> {
	public [methods.GET](req: Request, res: Response, next: NextFunction) {
		return this.run(req, res, next);
	}

	public [methods.POST](req: Request, res: Response, next: NextFunction) {
		return this.run(req, res, next);
	}

	private run(req: Request, res: Response, next: NextFunction) {
		if (process.env.NODE_ENV === "development") return next();

		const { authorization } = req.headers;
		if (typeof authorization !== "string") {
			const error = new ApiError(HttpStatusCode.Unauthorized, { Authorization: "Missing appropiate authorization header" });
			return next(error);
		}

		const [type, token] = authorization.split(/ +/g);
		if (type !== "Bearer" || token !== process.env.INTERNAL_API_KEY) {
			const error = new ApiError(HttpStatusCode.Unauthorized, { Authorization: "Incorrect header value (scope or key)" });
			return next(error);
		}

		next();
	}
}
