import type { Tag as iTag } from "@prisma/client";
import type { Content } from "./Content.js";
import type { CreatorHubServer } from "#lib/Server.js";

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
}
