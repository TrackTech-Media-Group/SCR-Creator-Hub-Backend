import type { CreatorHubServer } from "#lib/Server.js";
import { ApiError } from "#errors/ApiError.js";
import { ApplyOptions, Middleware, methods } from "@snowcrystals/highway";
import { HttpStatusCode } from "axios";
import type { NextFunction, Request, Response } from "express";
import { Utils } from "#lib/utils.js";
import { ADMIN_USER_IDS } from "#lib/constants.js";

@ApplyOptions<Middleware.Options>({ id: "admin-authentication" })
export default class extends Middleware<CreatorHubServer> {
	public [methods.GET](req: Request, res: Response, next: NextFunction, context: Record<string, unknown>) {
		return this.run(req, res, next, context);
	}

	public [methods.POST](req: Request, res: Response, next: NextFunction, context: Record<string, unknown>) {
		return this.run(req, res, next, context);
	}

	public [methods.DELETE](req: Request, res: Response, next: NextFunction, context: Record<string, unknown>) {
		return this.run(req, res, next, context);
	}

	private run(req: Request, res: Response, next: NextFunction, context: Record<string, unknown>) {
		const { authorization } = req.headers;
		const unauhtorizedError = new ApiError(HttpStatusCode.Unauthorized, { authorization: "Invalid/expired header provided" });

		if (!authorization || typeof authorization !== "string") return next(unauhtorizedError);
		if (!authorization.startsWith("User")) return next(unauhtorizedError);

		const [, session] = authorization.split(/ +/g);
		if (!session) return next(unauhtorizedError);

		const jwt = Utils.verifyJwt(session, { ignoreExpiration: false, complete: true });
		if (typeof jwt !== "object" || !jwt.payload.userId || !jwt.payload.session) return next(unauhtorizedError);

		const jwtPayload = jwt.payload;
		const sessionData = this.server.userManager.sessions.get(jwtPayload.session);
		if (!sessionData || sessionData.user.userId !== jwtPayload.userId || !ADMIN_USER_IDS.includes(sessionData.user.userId))
			return next(unauhtorizedError);

		context.user = sessionData.user;
		next();
	}
}
