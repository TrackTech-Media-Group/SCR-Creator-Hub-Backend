import type { Request, Response } from "express";
import { ApiRoute, ApplyOptions } from "../../lib/Api/index.js";
import jwt from "jsonwebtoken";

@ApplyOptions({
	methods: "POST"
})
export default class extends ApiRoute {
	public override async run(req: Request, res: Response) {
		const { authorization } = req.headers;
		if (typeof authorization !== "string") {
			res.send({ token: "" });
			return;
		}

		const [type, _token] = authorization.split(/ +/g);
		if (type !== "User") {
			res.send({ token: "" });
			return;
		}

		const token = jwt.verify(_token, this.server.config.config.encryptionKey);
		if (typeof token !== "object" || typeof token.session !== "string" || typeof token.userId !== "string") {
			res.send({ token: "" });
			return;
		}

		const session = this.server.data.getSession(token.session, token.userId);
		if (!session || session.session.expirationDate.getTime() <= Date.now()) {
			res.sendStatus(204);
			return;
		}

		await this.server.userManager.oauth2.revokeToken(this.server.jwt.decrypt(session.session.accessToken));
		await this.server.prisma.session.delete({ where: { token: session.session.token } });

		const user = { ...session.user, sessions: session.user.sessions.filter((s) => s.token !== session.session.token) };
		this.server.data.users.set(user.userId, user);

		res.sendStatus(204);
	}
}
