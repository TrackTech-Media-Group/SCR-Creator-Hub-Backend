import type { CreatorHubServer } from "#lib/Server.js";
import { Content } from "#structures/Content.js";
import { Tag } from "#structures/Tag.js";
import { Utils } from "#lib/utils.js";
import type { Tag as iTag, Footage as iContent, Download } from "@prisma/client";
import { Logger } from "@snowcrystals/icicle";
import { bold } from "colorette";
import MeasurePerformance from "./decorators/MeasurePerformance.js";

export class ContentManager {
	/** A collection of all the available tags */
	public readonly tags: Map<string, Tag> = new Map();

	/** A collection of all the available content */
	public readonly content: Map<string, Content> = new Map();

	/** The server instance that is running the back-end api */
	public readonly server: CreatorHubServer;

	/** The logger instance for the Content Manager */
	public readonly logger = new Logger({ name: "Content Manager", level: Utils.getLoggerLevel() });

	public constructor(server: CreatorHubServer) {
		this.server = server;
	}

	public toString() {
		return "ContentManager";
	}

	/** Loads all the data from the PostgreSQL database -> exists with code 1 if the process fails */
	@MeasurePerformance()
	public async load() {
		const tags = await this.getAllTags();
		const content = await this.getAllContent();

		this.logger.debug(`Retrieved ${bold(tags.length)} tags and ${bold(content.length)} content items`);

		for (const tag of tags) {
			const instance = new Tag(tag, this.server);
			this.tags.set(instance.id, instance);
		}

		for (const item of content) {
			const tags = item.tagIds.map((id) => this.tags.get(id)).filter(Boolean) as Tag[];
			const instance = new Content({ ...item, tags }, this.server);

			tags.forEach((tag) => tag.content.push(instance));
			this.content.set(instance.id, instance);
		}

		this.logger.info(`Initiation complete.`);
	}

	/** Returns the list of available tags -> exits with code 1 if the process fails */
	private async getAllTags() {
		const onReject = (error: any) => {
			this.logger.fatal(`Unable to retrieve the list of tags: `, error);
			process.exit(1);
		};

		return new Promise<iTag[]>((res) => this.server.prisma.tag.findMany().then(res).catch(onReject));
	}

	/** Returns the list of available content -> exits with code 1 if the process fails */
	private async getAllContent() {
		const onReject = (error: any) => {
			this.logger.fatal(`Unable to retrieve the list of content: `, error);
			process.exit(1);
		};

		return new Promise<(iContent & { downloads: Download[] })[]>((res) =>
			this.server.prisma.footage
				.findMany({ include: { downloads: true } })
				.then(res)
				.catch(onReject)
		);
	}
}
