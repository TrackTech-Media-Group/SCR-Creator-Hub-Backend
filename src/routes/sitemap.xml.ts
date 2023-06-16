import type { CreatorHubServer } from "#lib/Server.js";
import { BASE_SITEMAP_URL } from "#lib/constants.js";
import { Sitemap } from "#lib/sitemap/Sitemap.js";
import { Route, methods } from "@snowcrystals/highway";
import type { Request, Response } from "express";

export default class extends Route<CreatorHubServer> {
	public sitemap!: Sitemap;
	public xml!: string;

	public [methods.GET](req: Request, res: Response) {
		res.set("Content-Type", "application/xml").send(this.xml);
	}

	public override onLoad(server: CreatorHubServer, originalRoute: string) {
		super.onLoad(server, originalRoute);

		this.sitemap = new Sitemap({ hostname: BASE_SITEMAP_URL, server });
		this.xml = this.sitemap.generate();

		setInterval(() => {
			this.xml = this.sitemap.generate();
		}, 6e5); // Re-generate every 600 seconds
	}
}
