import type { Request, Response, NextFunction } from "express";
import { ApplyOptions, Middleware, methods } from "@snowcrystals/highway";
import type { CreatorHubServer } from "#lib/Server.js";
import { Utils } from "#lib/utils.js";
import { ApiError } from "#lib/errors/ApiError.js";
import { HttpStatusCode } from "axios";

@ApplyOptions<Middleware.Options>({ id: "csrf-token-verification" })
export default class extends Middleware<CreatorHubServer> {
	public [methods.DELETE](req: Request, res: Response, next: NextFunction) {
		return this.run(req, res, next);
	}

	public [methods.POST](req: Request, res: Response, next: NextFunction) {
		return this.run(req, res, next);
	}

	public [methods.PUT](req: Request, res: Response, next: NextFunction) {
		return this.run(req, res, next);
	}

	private run(req: Request, res: Response, next: NextFunction): void {
		const cookie: string = req.cookies["XSRF-TOKEN"];
		const forbiddenError = new ApiError(HttpStatusCode.Forbidden, {});

		if (!cookie || typeof cookie !== "string") {
			forbiddenError.errors.state = "Invalid state cookie received.";
			return next(forbiddenError);
		}

		const header = req.headers["xsrf-token"];
		if (!header || typeof header !== "string") {
			forbiddenError.errors.header = "Invalid state header received.";
			return next(forbiddenError);
		}

		const stateCheckRes = Utils.verifyCsrfState(cookie, header);
		if (!stateCheckRes) {
			forbiddenError.errors.state = "CSRF-TOKENS do not match.";
			forbiddenError.errors.header = "CSRF-TOKENS do not match.";
			return next(forbiddenError);
		}

		next();
	}
}
