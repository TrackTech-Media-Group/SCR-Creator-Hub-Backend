import { Server } from "@snowcrystals/highway";
import { ContentManager } from "./ContentManager.js";
import { PrismaClient } from "@prisma/client";

export class CreatorHubServer extends Server {
	/** The manager responsible for all the content on Creator Hub */
	public readonly contentManager: ContentManager = new ContentManager(this);

	/** The bridge between the application and the PostgreSQL database */
	public readonly prisma = new PrismaClient();

	public async start() {
		await this.contentManager.load();
		await this.listen(3000);
	}
}
