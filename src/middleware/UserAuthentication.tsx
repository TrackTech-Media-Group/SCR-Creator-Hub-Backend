import type { CreatorHubServer } from "#lib/Server.js";
import { ApiError } from "#errors/ApiError.js";
import { ApplyOptions, Middleware, methods } from "@snowcrystals/highway";
import { HttpStatusCode } from "axios";
import type { NextFunction, Request, Response } from "express";
import { Utils } from "#lib/utils.js";

@ApplyOptions<Middleware.Options>({ id: "user-authentication" })
export default class extends Middleware<CreatorHubServer> {
	public [methods.GET](req: Request, res: Response, next: NextFunction, context: Record<string, unknown>) {
		return this.run(req, res, next, context);
	}

	public [methods.POST](req: Request, res: Response, next: NextFunction, context: Record<string, unknown>) {
		return this.run(req, res, next, context);
	}

	private run(req: Request, res: Response, next: NextFunction, context: Record<string, unknown>) {
		const { authorization } = req.headers;
		const badHeaderError = new ApiError(HttpStatusCode.BadRequest, { authorization: "Invalid header provided" });
		const modifiedHeaderError = new ApiError(HttpStatusCode.Forbidden, { authorization: "Modified header provided" });

		if (!authorization || typeof authorization !== "string") return next(badHeaderError);
		if (!authorization.startsWith("User")) return next(badHeaderError);

		const [, session] = authorization.split(/ +/g);
		if (!session) return next(badHeaderError);

		const jwt = Utils.verifyJwt(session, { ignoreExpiration: false, complete: true });
		if (typeof jwt !== "object" || !jwt.payload.userId || !jwt.payload.session) return next(modifiedHeaderError);

		const jwtPayload = jwt.payload;
		const sessionData = this.server.userManager.sessions.get(jwtPayload.session);
		if (!sessionData || sessionData.user.userId !== jwtPayload.userId) return next(modifiedHeaderError);

		context.user = sessionData.user;
		next();
	}
}
