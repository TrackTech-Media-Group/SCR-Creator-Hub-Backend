import type { CreatorHubServer } from "#lib/Server.js";
import { ApiError } from "#lib/errors/ApiError.js";
import { Utils } from "#lib/utils.js";
import { Route, methods } from "@snowcrystals/highway";
import { HttpStatusCode } from "axios";
import type { NextFunction, Request, Response } from "express";

export default class extends Route<CreatorHubServer> {
	public async [methods.DELETE](req: Request, res: Response, next: NextFunction) {
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

		await this.server.userManager.deleteSession(jwt.payload.session);
		res.end();
	}
}
