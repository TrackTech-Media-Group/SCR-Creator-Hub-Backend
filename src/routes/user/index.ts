import type { Response } from "express";
import { ApiRoute, ApplyOptions } from "../../lib/Api/index.js";
import type { UserApiRequest } from "../../middleware/UserAuth.js";

@ApplyOptions({
	methods: "GET",
	middleware: ["user-auth"]
})
export default class extends ApiRoute {
	public override async run(req: UserApiRequest, res: Response) {
		const bookmarks = await this.server.prisma.footage.findMany({
			where: { id: { in: req.locals.user.bookmarks } },
			include: { downloads: true }
		});
		const recent = await this.server.prisma.footage.findMany({ where: { id: { in: req.locals.user.recent } }, include: { downloads: true } });
		const tags = await this.server.prisma.tag.findMany();

		res.send({
			name: req.locals.user.username,
			bookmarks: bookmarks.map((footage) => ({
				name: footage.name,
				id: footage.id,
				tags: footage.tagIds.map((t) => tags.find((tag) => tag.id === t)?.name).filter(Boolean),
				preview: footage.downloads.find((d) => d.name.startsWith("HD"))?.url ?? footage.downloads[0].url
			})),
			recent: recent.map((footage) => ({
				name: footage.name,
				id: footage.id,
				preview: footage.downloads.find((d) => d.name.startsWith("HD"))?.url ?? footage.downloads[0].url
			})),
			dataRequest: null
		});
	}
}
