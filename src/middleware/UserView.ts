import type { CreatorHubServer } from "#lib/Server.js";
import { ApplyOptions, Middleware, methods } from "@snowcrystals/highway";
import type { NextFunction, Request, Response } from "express";
import { Utils } from "#lib/utils.js";

@ApplyOptions<Middleware.Options>({ id: "user-view" })
export default class extends Middleware<CreatorHubServer> {
	public [methods.GET](req: Request, res: Response, next: NextFunction, context: Record<string, unknown>) {
		return this.run(req, res, next, context);
	}

	private run(req: Request, res: Response, next: NextFunction, context: Record<string, unknown>) {
		const { authorization } = req.headers;
		const { id } = req.params;
		if (!id) return next();

		if (!authorization || typeof authorization !== "string") return next();
		if (!authorization.startsWith("User")) return next();

		const [, session] = authorization.split(/ +/g);
		if (!session) return next();

		const jwt = Utils.verifyJwt(session, { ignoreExpiration: false, complete: true });
		if (typeof jwt !== "object" || !jwt.payload.userId || !jwt.payload.session) return next();

		const jwtPayload = jwt.payload;
		const sessionData = this.server.userManager.sessions.get(jwtPayload.session);
		if (!sessionData || sessionData.user.userId !== jwtPayload.userId) return next();

		context.user = sessionData.user;
		void this.server.userManager.updateRecent(sessionData.user, id);

		next();
	}
}
