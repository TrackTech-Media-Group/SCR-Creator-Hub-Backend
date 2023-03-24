import type { Request, Response } from "express";
import { ApiRoute, ApplyOptions } from "../../lib/Api/index.js";
import _ from "lodash";
import jwt from "jsonwebtoken";

@ApplyOptions({
	methods: "GET",
	middleware: ["internal-api", "user-view"]
})
export default class extends ApiRoute {
	public override run(req: Request, res: Response) {
		const { id } = req.params;

		const { tags } = this.server.data;
		const footage = this.server.data.footage.find((f) => f.id === id);
		if (!footage) {
			res.sendStatus(404);
			return;
		}

		const preview = (footage.downloads.find((d) => d.name.startsWith("HD")) ?? footage.downloads[0]).url;
		const marked = this.getMarked(req, res);

		res.send({
			...footage,
			preview,
			marked,
			tags: tags.filter((t) => footage.tagIds.includes(t.id)),
			downloads: footage.downloads.map((download) => ({ name: download.name, url: download.url }))
		});
	}

	private getMarked(req: Request, res: Response) {
		const session = req.headers["x-user-token"];
		if (typeof session !== "string") {
			return false;
		}

		const token = jwt.verify(session, this.server.config.config.encryptionKey);
		if (typeof token !== "object" || typeof token.session !== "string" || typeof token.userId !== "string") {
			return false;
		}

		const sessionData = this.server.data.getSession(token.session, token.userId);
		if (!sessionData || sessionData.session.expirationDate.getTime() <= Date.now()) {
			return false;
		}

		if (sessionData.user.bookmarks.includes(req.params.id)) return true;
		return false;
	}
}
