import type { Footage as iFootage, Download as iDownload } from "@prisma/client";
import { Download } from "./Download.js";
import { Tag } from "./Tag.js";
import type { CreatorHubServer } from "#lib/Server.js";
import type { ContentType } from "#lib/constants.js";

type FullContent = iFootage & { downloads: iDownload[]; tags: Tag[] };

export class Content implements iFootage {
	/** The unique identifier of this item */
	public readonly id: string;

	/** The public name of this item */
	public name: string;

	/** The preview url for this item */
	public preview: string | null;

	/** The tag ids associated with this item */
	public tagIds: string[];

	/** The content type */
	public readonly type: ContentType;

	/** The use cases for this item */
	public useCases: string[];

	/** The download options for this item */
	public downloads: Download[];

	/** The tags associated with this item */
	public tags: Tag[];

	/** The server instance that is running the back-end api */
	public readonly server: CreatorHubServer;

	public constructor(data: FullContent, server: CreatorHubServer) {
		this.id = data.id;
		this.name = data.name;
		this.preview = data.preview;
		this.tagIds = data.tagIds;
		this.type = data.type as any;
		this.useCases = data.useCases;

		this.downloads = data.downloads.map((download) => new Download(download, this));
		this.tags = data.tags;

		this.server = server;
	}

	public toString(): string {
		return this.name;
	}

	public getPreview(): string {
		if (this.preview) return this.preview;

		const preview = this.downloads.find((download) => download.name.includes("HD"))?.url ?? this.downloads[0].url;
		return preview ?? "";
	}

	public toJSON() {
		return {
			id: this.id,
			name: this.name,
			preview: this.getPreview(),
			tags: this.tags.map((tag) => tag.toJSON()),
			type: this.type,
			useCases: this.useCases,
			downloads: this.downloads.map((download) => download.toJSON())
		};
	}

	/** Whether or not the content is a video */
	public isVideo(): boolean {
		return this.type === "video";
	}

	/** Whether or not the content is an image */
	public isImage(): boolean {
		return this.type === "image";
	}

	/** Whether or not the content is an audio track */
	public isMusic(): boolean {
		return this.type === "music";
	}
}
