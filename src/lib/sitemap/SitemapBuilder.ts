/**
MIT License

Copyright (c) 2019 Vishnu Sankar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/**
 * Builder class to generate xml and robots.txt
 * Returns only string values
 */
export class SitemapBuilder {
	/**
	 * Generates sitemap.xml
	 * @param fields
	 * @returns
	 */
	public buildSitemapXml(fields: ISitemapField[]): string {
		const content = fields
			.map((x: ISitemapField) => {
				// Normalize sitemap field keys to stay consistent with <xsd:sequence> order
				const field = this.normalizeSitemapField(x);

				// Field array to keep track of properties
				const fieldArr: Array<string> = [];

				// Iterate all object keys and key value pair to field-set
				for (const key of Object.keys(field)) {
					// Skip reserved keys
					if (["trailingSlash"].includes(key)) {
						continue;
					}

					const child = field[key as keyof typeof field];
					if (child) {
						if (key === "alternateRefs") {
							const altRefField = this.buildAlternateRefsXml(field.alternateRefs);

							fieldArr.push(altRefField);
						} else if (key === "news") {
							if (field.news) {
								const newsField = this.buildNewsXml(field.news);
								fieldArr.push(newsField);
							}
						} else if (key === "images") {
							if (field.images) {
								for (const image of field.images) {
									const imageField = this.buildImageXml(image);
									fieldArr.push(imageField);
								}
							}
						} else if (key === "videos") {
							if (field.videos) {
								for (const video of field.videos) {
									const videoField = this.buildVideoXml(video);
									fieldArr.push(videoField);
								}
							}
						} else {
							fieldArr.push(`<${key}>${child}</${key}>`);
						}
					}
				}

				// Append previous value and return
				return `<url>${fieldArr.join("")}</url>\n`;
			})
			.join("");

		return this.withXMLTemplate(content);
	}

	/**
	 * Generates sitemap-index.xml
	 * @param allSitemaps
	 * @returns
	 */
	public buildSitemapIndexXml(allSitemaps: string[]) {
		return [
			'<?xml version="1.0" encoding="UTF-8"?>',
			'<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
			...(allSitemaps?.map((x) => `<sitemap><loc>${x}</loc></sitemap>`) ?? []),
			"</sitemapindex>"
		].join("\n");
	}

	/**
	 * Normalize sitemap field keys to stay consistent with <xsd:sequence> order
	 * @link https://www.w3schools.com/xml/el_sequence.asp
	 * @link https://github.com/iamvishnusankar/next-sitemap/issues/345
	 * @param x
	 * @returns
	 */
	private normalizeSitemapField(x: ISitemapField) {
		const { loc, lastmod, changefreq, priority, ...restProps } = x;

		// Return keys in following order
		return {
			loc,
			lastmod,
			changefreq,
			priority,
			...restProps
		};
	}

	/**
	 * Create XML Template
	 * @param content
	 * @returns
	 */
	private withXMLTemplate(content: string): string {
		return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n${content}</urlset>`;
	}

	/**
	 * Composes YYYY-MM-DDThh:mm:ssTZD date format (with TZ offset)
	 * (ref: https://stackoverflow.com/a/49332027)
	 * @param date
	 * @private
	 */
	private formatDate(date: Date | string): string {
		const d = typeof date === "string" ? new Date(date) : date;

		const z = (n: number) => `0${n}`.slice(-2);
		const zz = (n: number) => `00${n}`.slice(-3);

		let off = d.getTimezoneOffset();
		const sign = off > 0 ? "-" : "+";
		off = Math.abs(off);

		return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}.${zz(
			d.getMilliseconds()
		)}${sign}${z((off / 60) | 0)}:${z(off % 60)}`;
	}

	private formatBoolean(value: boolean): string {
		return value ? "yes" : "no";
	}

	private escapeHtml(s: string) {
		return s.replace(/[^\dA-Za-z ]/g, (c) => `&#${c.charCodeAt(0)};`);
	}

	/**
	 * Generate alternate refs.xml
	 * @param alternateRefs
	 * @returns
	 */
	private buildAlternateRefsXml(alternateRefs: Array<IAlternateRef> = []): string {
		return alternateRefs
			.map((alternateRef) => {
				return `<xhtml:link rel="alternate" hreflang="${alternateRef.hreflang}" href="${alternateRef.href}"/>`;
			})
			.join("");
	}

	/**
	 * Generate Google News sitemap entry
	 * @param news
	 * @returns string
	 */
	private buildNewsXml(news: IGoogleNewsEntry): string {
		// using array just because it looks more structured
		return [
			`<news:news>`,
			...[
				`<news:publication>`,
				...[`<news:name>${this.escapeHtml(news.publicationName)}</news:name>`, `<news:language>${news.publicationLanguage}</news:language>`],
				`</news:publication>`,
				`<news:publication_date>${this.formatDate(news.date)}</news:publication_date>`,
				`<news:title>${this.escapeHtml(news.title)}</news:title>`
			],
			`</news:news>`
		]
			.filter(Boolean)
			.join("");
	}

	/**
	 * Generate Image sitemap entry
	 * @param image
	 * @returns string
	 */
	private buildImageXml(image: IImageEntry): string {
		// using array just because it looks more structured
		return [
			`<image:image>`,
			...[
				`<image:loc>${image.loc.href}</image:loc>`,
				image.caption && `<image:caption>${this.escapeHtml(image.caption)}</image:caption>`,
				image.title && `<image:title>${this.escapeHtml(image.title)}</image:title>`,
				image.geoLocation && `<image:geo_location>${this.escapeHtml(image.geoLocation)}</image:geo_location>`,
				image.license && `<image:license>${image.license.href}</image:license>`
			],
			`</image:image>`
		]
			.filter(Boolean)
			.join("");
	}

	/**
	 * Generate Video sitemap entry
	 * @param video
	 * @returns string
	 */
	private buildVideoXml(video: IVideoEntry): string {
		// using array just because it looks more structured
		return [
			`<video:video>`,
			...[
				`<video:title>${this.escapeHtml(video.title)}</video:title>`,
				`<video:thumbnail_loc>${video.thumbnailLoc.href}</video:thumbnail_loc>`,
				`<video:description>${this.escapeHtml(video.description)}</video:description>`,
				video.contentLoc && `<video:content_loc>${video.contentLoc.href}</video:content_loc>`,
				video.playerLoc && `<video:player_loc>${video.playerLoc.href}</video:player_loc>`,
				video.duration && `<video:duration>${video.duration}</video:duration>`,
				video.viewCount && `<video:view_count>${video.viewCount}</video:view_count>`,
				video.tag && `<video:tag>${this.escapeHtml(video.tag)}</video:tag>`,
				video.rating && `<video:rating>${video.rating.toFixed(1).replace(",", ".")}</video:rating>`,
				video.expirationDate && `<video:expiration_date>${this.formatDate(video.expirationDate)}</video:expiration_date>`,
				video.publicationDate && `<video:publication_date>${this.formatDate(video.publicationDate)}</video:publication_date>`,
				typeof video.familyFriendly !== "undefined" &&
					`<video:family_friendly>${this.formatBoolean(video.familyFriendly)}</video:family_friendly>`,
				typeof video.requiresSubscription !== "undefined" &&
					`<video:requires_subscription>${this.formatBoolean(video.requiresSubscription)}</video:requires_subscription>`,
				typeof video.live !== "undefined" && `<video:live>${this.formatBoolean(video.live)}</video:live>`,
				video.restriction &&
					`<video:restriction relationship="${video.restriction.relationship}">${video.restriction.content}</video:restriction>`,
				video.platform && `<video:platform relationship="${video.platform.relationship}">${video.platform.content}</video:platform>`,
				video.uploader &&
					`<video:uploader${video.uploader.info && ` info="${video.uploader.info}"`}>${this.escapeHtml(
						video.uploader.name
					)}</video:uploader>`
			],
			`</video:video>`
		]
			.filter(Boolean)
			.join("");
	}
}

type MaybeUndefined<T> = T | undefined;
type MaybePromise<T> = T | Promise<T>;

type Changefreq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

/**
 * Robot.txt policy options
 */
export interface IRobotPolicy {
	/**
	 * User agent name
	 */
	userAgent: string;

	/**
	 * Disallow option(s)
	 */
	disallow?: string | string[];

	/**
	 * Allow option(s)
	 */
	allow?: string | string[];

	/**
	 * Crawl delay
	 */
	crawlDelay?: number;
}

/**
 * robots.txt Options
 */
export interface IRobotsTxt {
	/**
	 * Crawl policies
	 */
	policies?: IRobotPolicy[];

	/**
	 * Additional sitemaps which need to be added to robots
	 */
	additionalSitemaps?: string[];

	/**
	 * From v2.4x onwards, generated `robots.txt` will only contain url of `index sitemap` and custom provided endpoints from `robotsTxtOptions.additionalSitemaps`
	 *
	 * This is to prevent duplicate url submission (once through index-sitemap -> sitemap-url and once through robots.txt -> HOST)
	 *
	 * Set this option `true` to add all generated sitemap endpoints to `robots.txt`
	 * @default false
	 */
	includeNonIndexSitemaps?: boolean;

	/**
	 * Custom robots.txt transformer
	 */
	transformRobotsTxt?: (config: IConfig, robotsTxt: string) => Promise<string>;
}

/**
 * Sitemap configuration
 */
export interface IConfig {
	/**
	 * Base url of your website
	 */
	siteUrl: string;

	/**
	 * Change frequency.
	 * @default 'daily'
	 */
	changefreq?: Changefreq;

	/**
	 * The type of build output.
	 * @see https://nextjs.org/docs/pages/api-reference/next-config-js/output
	 */
	output?: "standalone" | "export" | undefined;

	/**
	 * Priority
	 * @default 0.7
	 */
	priority?: any;

	/**
	 * The name of the generated sitemap file before the file extension.
	 * @default "sitemap"
	 */
	sitemapBaseFileName?: string;

	/**
	 * next.js build directory.
	 * @default .next
	 */
	sourceDir?: string;

	/**
	 * All the generated files will be exported to this directory.
	 * @default public
	 */
	outDir?: string;

	/**
	 * Split large sitemap into multiple files by specifying sitemap size.
	 * @default 5000
	 */
	sitemapSize?: number;

	/**
	 * Generate a robots.txt file and list the generated sitemaps.
	 * @default false
	 */
	generateRobotsTxt?: boolean;

	/**
	 * robots.txt options
	 */
	robotsTxtOptions?: IRobotsTxt;

	/**
	 * Add <lastmod/> property.
	 * @default true
	 */
	autoLastmod?: boolean;

	/**
	 * Array of relative paths (wildcard pattern supported) to exclude from listing on sitemap.xml or sitemap-*.xml.
	 * Apart from this option next-sitemap also offers a custom transform option which could be used to exclude urls that match specific patterns
	 * @example ['/page-0', '/page-*', '/private/*']
	 */
	exclude?: string[] | (() => Promise<string[]>);

	alternateRefs?: Array<IAlternateRef>;

	/**
	 * A transformation function, which runs for each relative-path in the sitemap. Returning null value from the transformation function will result in the exclusion of that specific path from the generated sitemap list.
	 * @link https://github.com/iamvishnusankar/next-sitemap#custom-transformation-function
	 */
	transform?: (config: IConfig, url: string) => MaybePromise<MaybeUndefined<ISitemapField>>;

	/**
	 * A function that returns a list of additional paths to be added to the generated sitemap list.
	 * @link https://github.com/iamvishnusankar/next-sitemap#additional-paths-function
	 */
	additionalPaths?: (config: AdditionalPathsConfig) => MaybePromise<MaybeUndefined<ISitemapField>[]>;

	/**
	 * Include trailing slash
	 */
	trailingSlash?: boolean;

	/**
	 * Boolean to enable/disable index sitemap generation
	 * If enabled next-sitemap will generate sitemap-*.xml and sitemap.xml (index sitemap)
	 * @default true
	 */
	generateIndexSitemap?: boolean;
}

export type AdditionalPathsConfig = Readonly<
	IConfig & {
		transform: NonNullable<IConfig["transform"]>;
	}
>;

export interface IBuildManifest {
	pages: {
		[key: string]: string[];
	};
	ampFirstPages?: string[];
}

export interface IPreRenderManifest {
	routes: {
		[key: string]: any;
	};
	notFoundRoutes: string[];
}

export interface IRoutesManifest {
	i18n?: {
		locales: string[];
		defaultLocale: string;
	};
}

export interface IExportMarker {
	exportTrailingSlash: boolean;
}

export interface INextManifest {
	build?: IBuildManifest;
	preRender?: IPreRenderManifest;
	routes?: IRoutesManifest;
	staticExportPages?: string[];
}

/**
 * Use IExportable instead
 * @deprecated
 */
export interface ISitemapChunk {
	path: string;
	fields: ISitemapField[];
	filename: string;
}

export interface IExportable {
	url: string;
	filename: string;
	content: string;
	type: "robots.txt" | "sitemap" | "sitemap-index";
}

export interface IRuntimePaths {
	BUILD_MANIFEST: string;
	PRERENDER_MANIFEST: string;
	ROUTES_MANIFEST: string;
	ROBOTS_TXT_FILE: string;
	EXPORT_MARKER: string;
	SITEMAP_INDEX_FILE?: string;
	SITEMAP_INDEX_URL?: string;
	STATIC_EXPORT_ROOT: string;
}

export interface IAlternateRef {
	href: string;
	hreflang: string;
	hrefIsAbsolute?: boolean;
}

export interface IGoogleNewsEntry {
	title: string;
	date: Date | string;
	publicationName: string;
	publicationLanguage: string;
}

export interface IImageEntry {
	loc: URL;
	caption?: string;
	geoLocation?: string;
	title?: string;
	license?: URL;
}

export interface IRestriction {
	relationship: "allow" | "deny";
	content: string;
}

export interface IVideoEntry {
	title: string;
	thumbnailLoc: URL;
	description: string;
	contentLoc?: URL;
	playerLoc?: URL;
	duration?: number;
	expirationDate?: Date | string;
	rating?: number;
	viewCount?: number;
	publicationDate?: Date | string;
	familyFriendly?: boolean;
	restriction?: IRestriction;
	platform?: IRestriction;
	requiresSubscription?: boolean;
	uploader?: {
		name: string;
		info?: URL;
	};
	live?: boolean;
	tag?: string;
}

export interface ISitemapField {
	loc: string;
	lastmod?: string;
	changefreq?: Changefreq;
	priority?: number;
	alternateRefs?: Array<IAlternateRef>;
	trailingSlash?: boolean;

	news?: IGoogleNewsEntry;
	images?: Array<IImageEntry>;
	videos?: Array<IVideoEntry>;
}

export interface INextSitemapResult {
	sitemaps: string[];
	sitemapIndices: string[];
	runtimePaths: IRuntimePaths;
}
