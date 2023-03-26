import type { Response } from "express";
import { ApiRoute, ApplyOptions } from "../../lib/Api/index.js";
import type { UserApiRequest } from "../../middleware/UserAuth.js";

@ApplyOptions({
	methods: "GET",
	middleware: ["user-auth"]
})
export default class extends ApiRoute {
	public override run(req: UserApiRequest, res: Response) {
		const bookmarks = this.server.data.footage.filter((f) => req.locals.user.bookmarks.includes(f.id));
		const recent = req.locals.user.recent

			.map((id) => this.server.data.footage.find((r) => r.id === id))
			.filter(Boolean) as typeof this.server.data.footage;
		const { tags } = this.server.data;

		res.send({
			name: req.locals.user.username,
			bookmarks: bookmarks.map((footage) => ({
				name: footage.name,
				id: footage.id,
				type: footage.type,
				tags: footage.tagIds.map((t) => tags.find((tag) => tag.id === t)?.name).filter(Boolean),
				preview: footage.preview || footage.downloads.find((d) => d.name.startsWith("HD"))?.url || footage.downloads[0].url
			})),
			recent: recent.map((footage) => ({
				name: footage.name,
				id: footage.id,
				type: footage.type,
				preview: footage.preview || footage.downloads.find((d) => d.name.startsWith("HD"))?.url || footage.downloads[0].url
			})),
			dataRequest: null
		});
	}
}
