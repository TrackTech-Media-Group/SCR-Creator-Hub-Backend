import type { Response } from "express";
import { ApiRoute, ApplyOptions } from "../../lib/Api/index.js";
import type { UserApiRequest } from "../../middleware/UserAuth.js";

@ApplyOptions({
	methods: "DELETE",
	middleware: ["user-auth", "csrf-protection"]
})
export default class extends ApiRoute {
	public override async run(req: UserApiRequest, res: Response) {
		try {
			await this.server.userManager.sessions.deleteSessions(req.locals.user.userId);
			await this.server.prisma.user.delete({ where: { userId: req.locals.user.userId } });
			res.sendStatus(204);
		} catch (err) {
			this.server.logger.fatal(`[DELETE-USER]: `, err);
			res.status(500).send({ message: "Internal server error, please try again later!" });
		}
	}
}
