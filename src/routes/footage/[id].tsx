import type { Request, Response } from "express";
import { ApiRoute, ApplyOptions } from "../../lib/Api/index.js";
import _ from "lodash";
import jwt from "jsonwebtoken";

@ApplyOptions({
	methods: "GET",
	middleware: ["internal-api", "user-view"]
})
export default class extends ApiRoute {
	public override async run(req: Request, res: Response) {
		const { id } = req.params;

		const tags = await this.server.prisma.tag.findMany();
		const footage = await this.server.prisma.footage.findFirst({ where: { id }, include: { downloads: true } });
		if (!footage) {
			res.sendStatus(404);
			return;
		}

		const preview = (footage.downloads.find((d) => d.name.startsWith("HD")) ?? footage.downloads[0]).url;
		const marked = await this.getMarked(req, res);

		res.send({
			...footage,
			preview,
			marked,
			tags: tags.filter((t) => footage.tagIds.includes(t.id)),
			downloads: footage.downloads.map((download) => ({ name: download.name, url: download.url }))
		});
	}

	private async getMarked(req: Request, res: Response) {
		const session = req.headers["x-user-token"];
		if (typeof session !== "string") {
			return false;
		}

		const token = jwt.verify(session, this.server.config.config.encryptionKey);
		if (typeof token !== "object" || typeof token.session !== "string" || typeof token.userId !== "string") {
			return false;
		}

		const sessionData = await this.server.prisma.session.findFirst({
			where: { token: token.session, userId: token.userId },
			include: { User: true }
		});
		if (!sessionData || sessionData.expirationDate.getTime() <= Date.now() || !sessionData.User) {
			return false;
		}

		if (sessionData.User.bookmarks.includes(req.params.id)) return true;
		return false;
	}
}
