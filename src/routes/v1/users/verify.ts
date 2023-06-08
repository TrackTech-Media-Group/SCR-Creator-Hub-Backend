import type { CreatorHubServer } from "#lib/Server.js";
import { ApiError } from "#lib/errors/ApiError.js";
import { Utils } from "#lib/utils.js";
import { Route, methods } from "@snowcrystals/highway";
import { HttpStatusCode } from "axios";
import type { NextFunction, Request, Response } from "express";

export default class extends Route<CreatorHubServer> {
	public [methods.GET](req: Request, res: Response, next: NextFunction) {
		const { authorization } = req.headers;
		const badHeaderError = new ApiError(HttpStatusCode.BadRequest, { authorization: "Invalid header provided" });

		if (!authorization || typeof authorization !== "string") return next(badHeaderError);
		if (!authorization.startsWith("User")) return next(badHeaderError);

		const [, session] = authorization.split(/ +/g);
		if (!session) return next(badHeaderError);

		const jwt = Utils.verifyJwt(session, { ignoreExpiration: false, complete: true });
		if (typeof jwt !== "object" || !jwt.payload.userId || !jwt.payload.session) {
			res.send(false);
			return;
		}

		const jwtPayload = jwt.payload;
		const sessionData = this.server.userManager.sessions.get(jwtPayload.session);
		if (!sessionData || sessionData.user.userId !== jwtPayload.userId) {
			res.send(false);
			return;
		}

		res.send(true);
	}
}
