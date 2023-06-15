import type { CreatorHubServer } from "#lib/Server.js";
import type { Content } from "#structures/Content.js";
import { SitemapBuilder, type ISitemapField, type IImageEntry, type IVideoEntry } from "./SitemapBuilder.js";

export class Sitemap {
	public readonly builder: SitemapBuilder;

	/** The base of every url */
	public readonly hostname: string;

	/** The creatorhub server */
	public readonly server: CreatorHubServer;

	public constructor(options: SitemapOptions) {
		this.builder = new SitemapBuilder();
		this.hostname = options.hostname;
		this.server = options.server;
	}

	public generate() {
		const contentFields = this.getContentFields();
		const tagFields = this.getTagFields();

		return this.builder.buildSitemapXml([...contentFields, ...tagFields]);
	}

	private getContentFields() {
		const { content } = this.server.contentManager;

		const getImages = (content: Content) =>
			content.downloads.map<IImageEntry>((download) => ({
				loc: new URL(download.url),
				title: download.name,
				caption: content.name,
				license: new URL(CONTENT_LICENSE)
			}));

		const getVideos = (content: Content) =>
			content.downloads.map<IVideoEntry>((download) => ({
				loc: new URL(download.url),
				thumbnailLoc: new URL(content.getPreview()),
				title: download.name,
				caption: content.name,
				license: new URL(CONTENT_LICENSE),
				description: "",
				live: false,
				requiresSubscription: false
			}));

		const CONTENT_LICENSE = `${this.hostname}/license`;
		return [...content.values()].map<ISitemapField>((content) => ({
			loc: `${this.hostname}/${content.type}/${content.id}`,
			priority: 0.8,
			changefreq: "weekly",
			images: content.isImage() ? getImages(content) : undefined,
			videos: content.isVideo() ? getVideos(content) : undefined
		}));
	}

	private getTagFields() {
		const { tags } = this.server.contentManager;
		return [...tags.values()].map<ISitemapField>((tag) => ({
			loc: `${this.hostname}/tags/${tag.id}`,
			priority: 0.9,
			changefreq: "monthly"
		}));
	}
}

interface SitemapOptions {
	/** The base of every url */
	hostname: string;

	/** The creatorhub server */
	server: CreatorHubServer;
}
