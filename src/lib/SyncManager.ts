import type { CreatorHubServer } from "./Server.js";
import { Logger } from "@snowcrystals/icicle";
import { bold } from "colorette";
import { Utils } from "./utils.js";

export class SyncManager {
	/** The cron job responsible for syncing everything every hour */
	public readonly cron!: NodeJS.Timeout;

	/** The logger logging messages to the console */
	public readonly logger = new Logger({ name: "SyncManager", level: Utils.getLoggerLevel() });

	public constructor(public readonly server: CreatorHubServer) {
		this.cron = setInterval(this.syncAll.bind(this), 36e5);
	}

	public async syncAll() {
		this.logger.info("Syncing data with database...");
		await this.syncContent();
		await this.syncUsers();
		this.logger.info("Hourly data-sync completed");
	}

	/** Syncs the server content with the database content */
	public async syncContent() {
		const { prisma, contentManager } = this.server;

		for (const content of contentManager.content.values()) {
			const contentLinkedDownloads = await prisma.download.findMany({ where: { contentId: content.id } });
			const shouldDelete = contentLinkedDownloads.filter((download) => !content.downloads.map((dwnld) => dwnld.id).includes(download.id));

			if (shouldDelete) await prisma.download.deleteMany({ where: { id: { in: shouldDelete.map((download) => download.id) } } });
			await prisma.content.update({ where: { id: content.id }, data: { tagIds: content.tagIds } });

			this.logger.debug(`(SyncContent): Syned ${bold(content.name)} (${content.id})`);
		}
	}

	/** Syncs the server users with the database users */
	public async syncUsers() {
		const { prisma, userManager } = this.server;
		for (const user of userManager.users.values()) {
			const bookmarks = user.bookmarks.map((bookmark) => bookmark.id);
			const recent = user.recent.map((recent) => recent.id);

			await prisma.user.update({ where: { userId: user.userId }, data: { bookmarks, recent } });
			this.logger.debug(`(SyncUser): Syned ${bold(user.username)} (${user.userId})`);
		}
	}
}
