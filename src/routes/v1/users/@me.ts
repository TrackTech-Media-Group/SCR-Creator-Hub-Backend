import type { CreatorHubServer } from "#lib/Server.js";
import type { UserContext } from "#lib/constants.js";
import { ApplyOptions, Route, methods } from "@snowcrystals/highway";
import type { NextFunction, Request, Response } from "express";

@ApplyOptions<Route.Options>({
	middleware: [
		[methods.GET, "user-authentication"],
		[methods.DELETE, "csrf-token-verification", "user-authentication"]
	]
})
export default class extends Route<CreatorHubServer> {
	public [methods.GET](req: Request, res: Response, next: NextFunction, context: UserContext) {
		res.send(context.user.toJSON());
	}

	public async [methods.DELETE](req: Request, res: Response, next: NextFunction, context: UserContext) {
		await this.server.userManager.deleteUser(context.user.userId);
		res.end();
	}
}
