import type { Tag as iTag } from "@prisma/client";
import type { Content } from "./Content.js";
import type { CreatorHubServer } from "#lib/Server.js";
import type { ContentTypeFilter } from "#lib/constants.js";

export class Tag implements iTag {
	/** The unqiue identifier of this tag */
	public readonly id: string;

	/** The human friendly name for this tag */
	public readonly name: string;

	/** The content associated with this tag */
	public content: Content[] = [];

	/** The server instance that is running the back-end api */
	public readonly server: CreatorHubServer;

	public constructor(data: iTag, server: CreatorHubServer) {
		this.id = data.id;
		this.name = data.name;
		this.server = server;
	}

	public toString() {
		return this.name;
	}

	public toJSON() {
		return {
			id: this.id,
			name: this.name
		};
	}

	/**
	 * Returns a random list of x amount of content
	 * @param amount The amount of items you want to get
	 */
	public getRandomContent(amount: number, type: ContentTypeFilter) {
		const startIndex = Math.max(0, Math.floor(Math.random() * this.content.length) - amount);
		const randomItems = this.getFiltered(type).slice(startIndex, startIndex + amount);

		return randomItems;
	}

	/**
	 * Returns content for the specified type
	 * @param type The type of content to get
	 */
	public getFiltered(type: ContentTypeFilter) {
		const filterContent = (content: Content) => {
			if (type === "all") return true;
			return content.type === type;
		};

		return this.content.filter(filterContent);
	}

	/**
	 * Checks whether or not the tag contains the specified type of content
	 * @param type The type of content to get
	 */
	public hasType(type: ContentTypeFilter): boolean {
		const filterContent = (content: Content) => {
			if (type === "all") return true;
			return content.type === type;
		};

		return this.content.some(filterContent);
	}
}
