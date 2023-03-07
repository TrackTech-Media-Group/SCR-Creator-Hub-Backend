import type { Response } from "express";
import { ApiRoute, ApplyOptions } from "../../lib/Api/index.js";
import type { UserApiRequest } from "../../middleware/UserAuth.js";

@ApplyOptions({
	methods: "POST",
	middleware: ["csrf-protection", "user-auth"]
})
export default class extends ApiRoute {
	public limit = 150;

	public override async run(req: UserApiRequest, res: Response) {
		const { id } = req.body;
		if (typeof id !== "string" || !id.length) {
			res.status(400).send({ message: "Missing id in body" });
			return;
		}

		const footage = await this.server.prisma.footage.findFirst({ where: { id } });
		if (!footage) {
			res.status(404).send({ message: "Footage not found" });
			return;
		}

		if (req.locals.user.bookmarks.includes(id)) {
			await this.server.prisma.user.update({
				where: { userId: req.locals.user.userId },
				data: { bookmarks: { set: req.locals.user.bookmarks.filter((b) => b !== id) } }
			});

			const token = this.server.jwt.generateCsrfToken();
			const host = req.headers.origin ?? req.headers.host ?? "https://scrcreate.app";
			const [ext, domain] = host.replace("http://", "").replace("https://", "").split(".").reverse();
			res.cookie("XSRF-TOKEN", token.token, { domain: process.env.NODE_ENV === "development" ? undefined : `.${domain}.${ext}` }).send({
				marked: false,
				csrf: token.state
			});
			return;
		}

		if (req.locals.user.bookmarks.length >= this.limit) {
			res.status(403).send({ message: `Limit of ${this.limit} bookmarks reached` });
			return;
		}

		await this.server.prisma.user.update({ where: { userId: req.locals.user.userId }, data: { bookmarks: { push: id } } });

		const token = this.server.jwt.generateCsrfToken();
		const host = req.headers.origin ?? req.headers.host ?? "https://scrcreate.app";
		const [ext, domain] = host.replace("http://", "").replace("https://", "").split(".").reverse();
		res.cookie("XSRF-TOKEN", token.token, { domain: process.env.NODE_ENV === "development" ? undefined : `.${domain}.${ext}` }).send({
			marked: true,
			csrf: token.state
		});
	}
}
