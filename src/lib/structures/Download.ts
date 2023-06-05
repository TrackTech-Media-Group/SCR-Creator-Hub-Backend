import type { Download as iDownload } from "@prisma/client";
import type { Content } from "./Content.js";

export class Download implements iDownload {
	/** The id of the footage associated with this download */
	public readonly footageId: string;

	/** The content associated with this download */
	public readonly content: Content;

	/** The unique identifier of this download */
	public readonly id: string;

	/** The download url for this download */
	public readonly url: string;

	/** The name of the download */
	public readonly name: string;

	public constructor(data: iDownload, content: Content) {
		this.footageId = data.footageId!;
		this.content = content;

		this.id = data.id;
		this.name = data.name;
		this.url = data.url;
	}

	public toString(): string {
		return this.name;
	}

	public toJSON() {
		return {
			url: this.url,
			name: this.name,
			id: this.id,
			contentId: this.footageId
		};
	}
}
