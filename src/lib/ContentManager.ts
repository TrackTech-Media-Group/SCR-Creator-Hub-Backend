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

	/**
	 * Creates a new content item
	 * @param data The content data
	 */
	public async createContent(data: Omit<iContent, "id" | "tagIds"> & { downloads: Omit<Download, "footageId" | "id">[]; tags: iTag[] }) {
		const content = await this.server.prisma.footage.create({
			data: {
				name: data.name,
				type: data.type,
				preview: data.preview,
				useCases: data.useCases,
				tagIds: data.tags.map((tag) => tag.id),
				downloads: {
					// data.downloads still contain the isPreview boolean, removing this statement will result in invalidArgs errors from prisma
					createMany: { data: data.downloads.map((download) => ({ name: download.name, url: download.url })), skipDuplicates: true }
				}
			},
			include: { downloads: true }
		});

		const tags = content.tagIds.map((id) => this.tags.get(id)).filter(Boolean) as Tag[];
		const contentInstance = new Content({ ...content, tags }, this.server);
		this.content.set(contentInstance.id, contentInstance);
	}

	/**
	 * Deletes a tag
	 * @param id The tag to delete
	 */
	public async deleteTag(id: string) {
		if (!this.tags.has(id)) return;

		await this.server.prisma.tag.delete({ where: { id } });
		this.tags.delete(id);

		for (const item of this.content.values()) {
			item.tagIds = item.tagIds.filter((tag) => tag !== id);
			item.tags = item.tags.filter((tag) => tag.id !== id);
		}
	}

	/**
	 * Creates a tag
	 * @param id The id of the tag
	 * @param name The name of the tag
	 */
	public async addTag(id: string, name: string) {
		if (this.tags.has(id)) return;

		const tagData = await this.server.prisma.tag.create({ data: { id, name } });
		const tag = new Tag(tagData, this.server);
		this.tags.set(id, tag);
	}

	/** Loads all the data from the PostgreSQL database -> exists with code 1 if the process fails */
	@MeasurePerformance({ async: true })
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

		this.logger.info("Initiation complete.");
	}

	/**
	 * Returns a random list of x amount of content
	 * @param amount The amount of items you want to get
	 */
	@MeasurePerformance()
	public getRandomContent(amount: number) {
		const startIndex = Math.max(0, Math.floor(Math.random() * this.content.size) - amount);
		const randomItems = [...this.content.values()].slice(startIndex, startIndex + amount);

		return randomItems;
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
