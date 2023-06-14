import type { CreatorHubServer } from "#lib/Server.js";
import { ApiError } from "#lib/errors/ApiError.js";
import { ApplyOptions, Route, methods } from "@snowcrystals/highway";
import { HttpStatusCode } from "axios";
import type { NextFunction, Request, Response } from "express";

@ApplyOptions<Route.Options>({
	middleware: [
		[methods.PUT, "admin-authentication"],
		[methods.DELETE, "admin-authentication"]
	]
})
export default class extends Route<CreatorHubServer> {
	public [methods.PUT](req: Request, res: Response) {
		// TODO: PUT METHOD HERE
	}

	public async [methods.DELETE](req: Request, res: Response, next: NextFunction) {
		const { id } = req.params;

		if (!this.server.contentManager.content.has(id)) {
			const unknownTag = new ApiError(HttpStatusCode.NotFound, { id: "Unknown content item" });
			return next(unknownTag);
		}

		await this.server.contentManager.deleteContent(id);
		res.sendStatus(204);
	}
}
