import type { CreatorHubServer } from "#lib/Server.js";
import type { UserContext } from "#lib/constants.js";
import { ApplyOptions, Route, methods } from "@snowcrystals/highway";
import type { NextFunction, Request, Response } from "express";

@ApplyOptions<Route.Options>({
	middleware: [[methods.DELETE, "csrf-token-verification", "user-authentication"]]
})
export default class extends Route<CreatorHubServer> {
	public async [methods.DELETE](req: Request, res: Response, next: NextFunction, context: UserContext) {
		await this.server.userManager.deleteSessions(context.user.userId);
		res.end();
	}
}
