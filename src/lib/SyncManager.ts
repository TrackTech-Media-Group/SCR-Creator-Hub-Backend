import { CronJob } from "cron";
import type { CreatorHubServer } from "./Server.js";
import { Logger } from "@snowcrystals/icicle";

export class SyncManager {
	/** The cron job responsible for syncing everything every hour */
	public readonly cron: CronJob;

	/** The logger logging messages to the console */
	public readonly logger = new Logger({ name: "SyncManager" });

	public constructor(public readonly server: CreatorHubServer) {
		this.cron = new CronJob("0 * * * *", this.syncAll.bind(this), this.onComplete.bind(this), true);
	}

	public onComplete() {
		this.logger.info("Hourly data-sync completed");
	}

	public async syncAll() {
		this.logger.info("Syncing data with database...");
		await this.syncContent();
		await this.syncUsers();
	}

	/** Syncs the server content with the database content */
	public async syncContent() {
		const { prisma, contentManager } = this.server;
		for await (const content of contentManager.content.values()) {
			const contentLinkedDownloads = await prisma.download.findMany({ where: { footageId: content.id } });
			const shouldDelete = contentLinkedDownloads.filter((download) => !content.downloads.map((dwnld) => dwnld.id).includes(download.id));

			await prisma.download.deleteMany({ where: { id: { in: shouldDelete.map((download) => download.id) } } });
			await prisma.footage.update({ where: { id: content.id }, data: { tagIds: content.tagIds } });
		}
	}

	/** Syncs the server users with the database users */
	public async syncUsers() {
		const { prisma, userManager } = this.server;
		for await (const user of userManager.users.values()) {
			const bookmarks = user.bookmarks.map((bookmark) => bookmark.id);
			const recent = user.recent.map((recent) => recent.id);

			await prisma.user.update({ where: { userId: user.userId }, data: { bookmarks, recent } });
		}
	}
}
