import type { CreatorHubServer } from "#lib/Server.js";
import type { UserContext } from "#lib/constants.js";
import { ApplyOptions, Route, methods } from "@snowcrystals/highway";
import type { NextFunction, Request, Response } from "express";

@ApplyOptions<Route.Options>({
	middleware: [
		[methods.GET, "user-view"],
		[methods.POST, "csrf-token-verification", "user-authentication"]
	]
})
export default class extends Route<CreatorHubServer> {
	public [methods.GET](req: Request, res: Response, next: NextFunction, context: Partial<UserContext>) {
		const { id } = req.params;
		const content = this.server.contentManager.content.get(id);
		const marked = context.user ? context.user.bookmarks.some((item) => item.id === id) : null;

		res.send({ content, marked });
	}

	public async [methods.POST](req: Request, res: Response, next: NextFunction, context: UserContext) {
		const { id } = req.params;
		const PrismaClient = this.server.prisma;
		const content = this.server.contentManager.content.get(id);
		if (!content) {
			res.send(false);
			return;
		}

		const bookmark = await context.user.toggleBookmark(content, PrismaClient);
		res.send(bookmark);
	}
}
