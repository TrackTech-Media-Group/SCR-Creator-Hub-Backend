import type { CreatorHubServer } from "#lib/Server.js";
import MeasurePerformance from "#lib/decorators/MeasurePerformance.js";
import { ApiError } from "#lib/errors/ApiError.js";
import { Utils } from "#lib/utils.js";
import { ApplyOptions, Route, methods } from "@snowcrystals/highway";
import { Logger } from "@snowcrystals/icicle";
import { HttpStatusCode } from "axios";
import type { NextFunction, Request, Response } from "express";

@ApplyOptions<Route.Options>({ middleware: [[methods.POST, "internal-api"]] })
export default class extends Route<CreatorHubServer> {
	public readonly logger = new Logger({ name: "/v1/callback" });

	@MeasurePerformance({ async: true, name: "Route#Callback(Methods.POST)" })
	public async [methods.POST](req: Request, res: Response, next: NextFunction) {
		const { code, state, stateToken } = req.body;
		try {
			if (!Utils.verifyAuthState(stateToken, state)) {
				const error = new ApiError(HttpStatusCode.Forbidden, { CSRF_TOKEN: "Unable to authenticate due to mismatched tokens." });
				return next(error);
			}

			const user = await this.server.userManager.getUserFromOauth2(code);
			const sessionCookie = await this.server.userManager.authenticateUser(user.id, user.username);

			res.send(sessionCookie);
		} catch (err) {
			this.logger.error(`(POST) => Unknown error occured while processing authentication request: `, err);
			const error = new ApiError(HttpStatusCode.InternalServerError, { "*": "An error occured while processing the authentication request." });
			next(error);
		}
	}
}
