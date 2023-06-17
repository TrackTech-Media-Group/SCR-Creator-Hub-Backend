import type { CreatorHubServer } from "#lib/Server.js";
import type { UserContext } from "#lib/constants.js";
import { Utils } from "#lib/utils.js";
import { ApplyOptions, Route, methods } from "@snowcrystals/highway";
import type { NextFunction, Request, Response } from "express";

@ApplyOptions<Route.Options>({
	middleware: [[methods.DELETE, "csrf-token-verification", "user-authentication"]],
	ratelimit: Utils.getRatelimitOptions({ windowMs: 15e3, max: 1 })
})
export default class extends Route<CreatorHubServer> {
	public async [methods.DELETE](req: Request, res: Response, next: NextFunction, context: UserContext) {
		await this.server.userManager.deleteSessions(context.user.userId);
		res.end();
	}
}
